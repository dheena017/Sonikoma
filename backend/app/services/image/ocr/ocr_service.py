"""
backend/app/services/image/ocr/ocr_service.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble OCR & script extraction service for scraped webtoon panel images.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import re
import logging
from typing import List, Dict, Any
import numpy as np
from PIL import Image

logger = logging.getLogger("sonikoma.services.image.ocr.ocr_service")

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


import time
import base64
from schemas.ocr import (
    DetectTextRequest,
    DetectTextResponse,
    OcrTextItem,
    OcrTextType
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.speech_bubble_detector import detect_yolo_entities


def extract_text_from_image_bytes(image_bytes: bytes, languages: List[str] = ["en"]) -> str:
    """Extracts raw dialogue text from an image buffer using EasyOCR or Tesseract fallback."""
    if not image_bytes:
        return ""
    try:
        from services.image.ocr.ocr_engine import _load_ocr_reader, _HAS_EASYOCR
        if _HAS_EASYOCR:
            reader = _load_ocr_reader(languages)
            if reader is not None:
                img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
                img_np = np.array(img_pil)
                results = reader.readtext(img_np)
                lines = [r[1].strip() for r in results if r[1].strip() and float(r[2]) >= 0.20]
                if lines:
                    return " ".join(lines)
    except Exception as e:
        pass

    # Fallback to Tesseract
    try:
        img = Image.open(io.BytesIO(image_bytes))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")

        if HAS_TESSERACT:
            text = pytesseract.image_to_string(img, config="--psm 6")
            raw_str = ""
            if isinstance(text, str):
                raw_str = text
            elif isinstance(text, dict):
                raw_str = str(text.get("text", ""))
            elif isinstance(text, bytes):
                raw_str = text.decode("utf-8", errors="ignore")

            clean_lines = [line.strip() for line in raw_str.splitlines() if line.strip()]
            return " ".join(clean_lines)
    except Exception as err:
        logger.warning(f"[OCR Service] Tesseract extraction warning: {err}")
    return ""


async def extract_bubble_guided_ocr(request: DetectTextRequest) -> DetectTextResponse:
    """
    High-precision bubble-guided OCR:
    1. Detects YOLO speech bubbles.
    2. Crops image exclusively within each speech bubble frame.
    3. Runs OCR inside the cropped bubble to eliminate all background art noise.
    """
    start_time = time.perf_counter()

    raw_bytes = None
    if request.url:
        resolved = await resolve_image_to_buffer(request.url)
        raw_bytes = resolved.get("data")
    elif request.image_base64:
        b64 = request.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        raise ValueError("Could not resolve image data for OCR extraction.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    # 1. Detect YOLO speech bubbles
    bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.20)
    segments: List[OcrTextItem] = []
    transcripts: List[str] = []

    for idx, b in enumerate(bubbles):
        # Dynamically scaled padding proportional to resolution
        pad = max(2, int(min(b.width, b.height) * 0.05))
        x1 = max(0, b.x - pad)
        y1 = max(0, b.y - pad)
        x2 = min(img_w, b.x + b.width + pad)
        y2 = min(img_h, b.y + b.height + pad)

        bubble_crop = pil_img.crop((x1, y1, x2, y2))
        buf = io.BytesIO()
        bubble_crop.save(buf, format="PNG")
        crop_bytes = buf.getvalue()

        # Run OCR on the isolated speech bubble
        extracted_text = extract_text_from_image_bytes(crop_bytes, request.languages)
        clean_text = re.sub(r'\s+', ' ', extracted_text).strip()

        if clean_text:
            text_type = OcrTextType.CAPTION if b.sub_type == "caption" else (
                OcrTextType.THOUGHT if b.sub_type == "thought" else OcrTextType.DIALOGUE
            )
            segments.append(OcrTextItem(
                segment_id=f"text_{idx + 1}",
                text=clean_text,
                confidence=b.confidence,
                text_type=text_type,
                x=b.x,
                y=b.y,
                width=b.width,
                height=b.height,
                polygon=b.polygon,
                bubble_id=b.bubble_id,
                reading_order=idx + 1
            ))
            transcripts.append(clean_text)

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    full_text = " ".join(transcripts)

    logger.info(f"[OCR Service] Bubble-guided OCR extracted {len(segments)} segment(s) ({len(full_text)} chars) in {elapsed_ms}ms")

    return DetectTextResponse(
        success=True,
        full_transcript=full_text,
        total_segments=len(segments),
        detected_language=request.languages[0] if request.languages else "en",
        segments=segments,
        execution_time_ms=elapsed_ms,
        message=f"Extracted {len(segments)} dialogue block(s) from {len(bubbles)} bubble(s) in {elapsed_ms}ms"
    )


async def extract_direct_image_ocr(request: DetectTextRequest) -> DetectTextResponse:
    """
    Direct synchronous OCR extractor across whole image or guided bubbles.
    """
    if request.bubble_guided:
        return await extract_bubble_guided_ocr(request)

    start_time = time.perf_counter()
    logger.info(f"[OCR Service] Starting direct OCR extraction (languages={request.languages})")
    raw_bytes = None
    if request.url:
        resolved = await resolve_image_to_buffer(request.url)
        raw_bytes = resolved.get("data")
    elif request.image_base64:
        b64 = request.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        logger.error("[OCR Service] Could not resolve image data for OCR.")
        raise ValueError("Could not resolve image data for OCR.")

    text = extract_text_from_image_bytes(raw_bytes, request.languages)
    clean_text = re.sub(r'\s+', ' ', text).strip()
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    segments = []
    if clean_text:
        segments.append(OcrTextItem(
            segment_id="text_1",
            text=clean_text,
            confidence=0.90,
            text_type=OcrTextType.DIALOGUE,
            x=0,
            y=0,
            width=100,
            height=100,
            reading_order=1
        ))

    logger.info(f"[OCR Service] Direct OCR completed in {elapsed_ms}ms (extracted {len(clean_text)} chars)")

    return DetectTextResponse(
        success=True,
        full_transcript=clean_text,
        total_segments=len(segments),
        detected_language=request.languages[0] if request.languages else "en",
        segments=segments,
        execution_time_ms=elapsed_ms,
        message=f"Direct OCR extracted transcript in {elapsed_ms}ms"
    )


async def extract_script_from_panels(
    image_buffers: List[bytes]
) -> List[Dict[str, Any]]:
    """
    Extracts speech bubble text across multiple panel image buffers.
    Returns structured dialogue list with panel_index, text, and confidence.
    """
    logger.info(f"[OCR Service] Extracting script across {len(image_buffers)} panel buffers")
    script_results = []

    for idx, buf in enumerate(image_buffers):
        try:
            dialogue_text = extract_text_from_image_bytes(buf)
            clean_dialogue = re.sub(r'\s+', ' ', dialogue_text).strip()

            if clean_dialogue:
                script_results.append({
                    "panel_index": idx + 1,
                    "text": clean_dialogue,
                    "confidence": 0.90 if HAS_TESSERACT else 0.70,
                    "has_dialogue": True
                })
            else:
                script_results.append({
                    "panel_index": idx + 1,
                    "text": "",
                    "confidence": 1.0,
                    "has_dialogue": False
                })
        except Exception as err:
            logger.warning(f"[OCR Service] Panel {idx + 1} processing error: {err}")
            script_results.append({
                "panel_index": idx + 1,
                "text": "",
                "confidence": 0.0,
                "has_dialogue": False
            })

    dialogue_count = sum(1 for s in script_results if s["has_dialogue"])
    logger.info(f"[OCR Service] Finished script extraction: found dialogue in {dialogue_count}/{len(image_buffers)} panels")
    return script_results
