"""
backend/app/services/scraper/ocr_service.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble OCR & script extraction service for scraped webtoon panel images.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import re
import logging
from typing import List, Dict, Any
from PIL import Image

logger = logging.getLogger("sonikoma.services.scraper.ocr_service")

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    """Extracts raw dialogue text from an image buffer using Tesseract OCR if available."""
    if not image_bytes:
        return ""
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


async def extract_script_from_panels(
    image_buffers: List[bytes]
) -> List[Dict[str, Any]]:
    """
    Extracts speech bubble text across multiple panel image buffers.
    Returns structured dialogue list with panel_index, text, and confidence.
    """
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

    return script_results
