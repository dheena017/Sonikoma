"""
backend/features/image_editor/services/ocr/ocr_service.py
─────────────────────────────────────────────────────────────────────────────
High-Level Dialogue OCR Service Orchestration:
- Fast & asynchronous FastAPI service endpoint handlers
- Mode A: YOLO speech bubble isolation + proportional bounding crop OCR
- Mode B: Full-frame direct OCR scanning via core engine
- Multi-panel chapter script extraction
─────────────────────────────────────────────────────────────────────────────
"""

import base64
import io
import logging
import time
from typing import Any, Dict, List, Optional

from PIL import Image

from common.media import resolve_image_to_buffer
from features.image_editor.schemas import (
    DetectTextRequest,
    DetectTextResponse,
    OcrTextItem,
    OcrTextType,
)
from features.image_editor.services.detector.main_service_detector.speech_bubble_detector import (
    detect_speech_bubbles as detect_yolo_bubbles,
)
try:
    from .ocr_engine import (
        extract_full_ocr_data,
    )
    from .ocr_geometry import (
        DEFAULT_BUBBLE_CONFIDENCE,
        DEFAULT_BUBBLE_PADDING_RATIO,
        DEFAULT_CONFIDENCE_THRESHOLD,
        MIN_IMAGE_DIMENSION_PX,
        compute_axis_aligned_bbox,
    )
    from .ocr_reader import (
        _HAS_EASYOCR,
        clean_transcript_whitespace,
        extract_text_from_image_bytes,
    )
except (ImportError, ValueError):
    from features.image_editor.services.ocr.ocr_engine import (
        extract_full_ocr_data,
    )
    from features.image_editor.services.ocr.ocr_geometry import (
        DEFAULT_BUBBLE_CONFIDENCE,
        DEFAULT_BUBBLE_PADDING_RATIO,
        DEFAULT_CONFIDENCE_THRESHOLD,
        MIN_IMAGE_DIMENSION_PX,
        compute_axis_aligned_bbox,
    )
    from features.image_editor.services.ocr.ocr_reader import (
        _HAS_EASYOCR,
        clean_transcript_whitespace,
        extract_text_from_image_bytes,
    )

logger = logging.getLogger("sonikoma.features.image_editor.services.ocr.ocr_service")


async def detect_text_service(request: DetectTextRequest) -> DetectTextResponse:
    """
    Main unified OCR service orchestrator.

    Automatically routes:
    - Mode A (`request.bubble_guided = True`): Isolates dialogue inside YOLO speech bubbles,
      cropping them with proportional padding to eliminate background art noise.
    - Mode B (`request.bubble_guided = False`): Full-frame direct OCR scanning via extract_full_ocr_data.

    Args:
        request (DetectTextRequest): Request payload with image source and target languages.

    Returns:
        DetectTextResponse: Standardized response with segments, reading order, and full transcript.
    """
    start_time = time.perf_counter()

    # ── Stage 1: Input Resolution & Decoding ────────────────────────────────
    raw_bytes: Optional[bytes] = None
    target_url = request.url
    if target_url:
        resolved = await resolve_image_to_buffer(target_url)
        raw_bytes = resolved.get("data")
    elif request.image_base64:
        b64 = request.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        logger.error("[Dialogue OCR API] Failed resolving raw image data from request.")
        raise ValueError("Could not resolve image data for text detection.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    if img_w < MIN_IMAGE_DIMENSION_PX or img_h < MIN_IMAGE_DIMENSION_PX:
        return DetectTextResponse(
            success=True,
            full_transcript="",
            total_segments=0,
            detected_language=request.languages[0] if request.languages else "en",
            segments=[],
            execution_time_ms=int((time.perf_counter() - start_time) * 1000),
            message="Image dimensions too small for text detection.",
        )

    # ── Stage 2: Mode A — High-Precision YOLO Bubble-Guided OCR ─────────────
    if request.bubble_guided:
        logger.info(f"[Dialogue OCR API] Mode A: Bubble-guided dialogue isolation ({img_w}x{img_h}px)...")
        bubbles = detect_yolo_bubbles(raw_bytes, conf_threshold=DEFAULT_BUBBLE_CONFIDENCE)
        segments: List[OcrTextItem] = []
        transcripts: List[str] = []

        for idx, b in enumerate(bubbles, start=1):
            pad = max(2, int(min(b.width, b.height) * DEFAULT_BUBBLE_PADDING_RATIO))
            x1 = max(0, b.x - pad)
            y1 = max(0, b.y - pad)
            x2 = min(img_w, b.x + b.width + pad)
            y2 = min(img_h, b.y + b.height + pad)

            bubble_crop = pil_img.crop((x1, y1, x2, y2))
            buf = io.BytesIO()
            bubble_crop.save(buf, format="PNG")

            extracted_text = extract_text_from_image_bytes(buf.getvalue(), request.languages)
            clean_text = clean_transcript_whitespace(extracted_text)

            if clean_text:
                sub_type = str(getattr(b, "sub_type", "")).lower()
                text_type = (
                    OcrTextType.CAPTION if "caption" in sub_type
                    else (OcrTextType.THOUGHT if "thought" in sub_type else OcrTextType.DIALOGUE)
                )

                segments.append(OcrTextItem(
                    segment_id=f"text_{idx}",
                    text=clean_text,
                    confidence=round(float(b.confidence), 2),
                    text_type=text_type,
                    x=b.x,
                    y=b.y,
                    width=b.width,
                    height=b.height,
                    polygon=b.polygon,
                    bubble_id=b.bubble_id,
                    reading_order=idx,
                ))
                transcripts.append(clean_text)

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        full_transcript = " ".join(transcripts)

        logger.info(
            f"[Dialogue OCR API] Mode A complete: {len(segments)} segment(s) "
            f"extracted from {len(bubbles)} bubble(s) in {elapsed_ms}ms."
        )

        return DetectTextResponse(
            success=True,
            full_transcript=full_transcript,
            total_segments=len(segments),
            detected_language=request.languages[0] if request.languages else "en",
            segments=segments,
            execution_time_ms=elapsed_ms,
            message=f"Extracted {len(segments)} dialogue block(s) from {len(bubbles)} bubble(s) in {elapsed_ms}ms",
        )

    # ── Stage 3: Mode B — Full-Frame Direct OCR Scanning ────────────────────
    logger.info(f"[Dialogue OCR API] Mode B: Full-frame direct OCR pass ({img_w}x{img_h}px)...")
    raw_segments = await extract_full_ocr_data(
        image_input=raw_bytes,
        langs=request.languages,
        confidence_threshold=DEFAULT_CONFIDENCE_THRESHOLD,
    )

    segments = []
    transcripts = []

    for idx, seg in enumerate(raw_segments, start=1):
        clean_text = clean_transcript_whitespace(seg["text"])
        if not clean_text:
            continue

        box = seg["box"]
        min_x, min_y, max_x, max_y = compute_axis_aligned_bbox(box)

        segments.append(OcrTextItem(
            segment_id=f"text_{idx}",
            text=clean_text,
            confidence=round(float(seg["conf"]), 2),
            text_type=OcrTextType.DIALOGUE,
            x=min_x,
            y=min_y,
            width=max(1, max_x - min_x),
            height=max(1, max_y - min_y),
            polygon=box,
            reading_order=idx,
        ))
        transcripts.append(clean_text)

    # Fallback to single text block if full OCR returned no segments but Tesseract can read it
    if not segments:
        single_text = extract_text_from_image_bytes(raw_bytes, request.languages)
        clean_single = clean_transcript_whitespace(single_text)
        if clean_single:
            segments.append(OcrTextItem(
                segment_id="text_1",
                text=clean_single,
                confidence=0.85,
                text_type=OcrTextType.DIALOGUE,
                x=0,
                y=0,
                width=100,
                height=100,
                reading_order=1,
            ))
            transcripts.append(clean_single)

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    full_transcript = " ".join(transcripts)

    logger.info(
        f"[Dialogue OCR API] Mode B complete in {elapsed_ms}ms: {len(segments)} segment(s) "
        f"extracted ({len(full_transcript)} chars)."
    )

    return DetectTextResponse(
        success=True,
        full_transcript=full_transcript,
        total_segments=len(segments),
        detected_language=request.languages[0] if request.languages else "en",
        segments=segments,
        execution_time_ms=elapsed_ms,
        message=f"Direct OCR extracted {len(segments)} segment(s) in {elapsed_ms}ms",
    )


extract_direct_image_ocr = detect_text_service


async def extract_bubble_guided_ocr(request: DetectTextRequest) -> DetectTextResponse:
    """Forces bubble-guided OCR execution and routes to detect_text_service."""
    request.bubble_guided = True
    return await detect_text_service(request)


async def extract_script_from_panels(
    image_buffers: List[bytes],
    languages: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Extracts transcribed dialogue lines across multiple panel image buffers for chapters."""
    if not image_buffers:
        return []

    logger.info(f"[Dialogue OCR API] Extracting script across {len(image_buffers)} panel buffer(s)...")
    script_results: List[Dict[str, Any]] = []

    for idx, buf in enumerate(image_buffers, start=1):
        try:
            dialogue_text = extract_text_from_image_bytes(buf, languages=languages)
            clean_dialogue = clean_transcript_whitespace(dialogue_text)

            script_results.append({
                "panel_index": idx,
                "text": clean_dialogue,
                "confidence": 0.90 if _HAS_EASYOCR else 0.75,
                "has_dialogue": bool(clean_dialogue),
            })
        except Exception as err:
            logger.warning(f"[Dialogue OCR API] Panel {idx} extraction warning: {err}")
            script_results.append({
                "panel_index": idx,
                "text": "",
                "confidence": 0.0,
                "has_dialogue": False,
            })

    return script_results


__all__ = [
    "detect_text_service",
    "extract_bubble_guided_ocr",
    "extract_direct_image_ocr",
    "extract_script_from_panels",
]
