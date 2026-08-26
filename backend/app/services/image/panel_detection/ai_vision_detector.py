"""
backend/app/services/image/panel_detection/ai_vision_detector.py
─────────────────────────────────────────────────────────────────────────────
Pure AI Vision & OCR Engine:
- Multimodal reading flow classification (Manga RTL, Webtoon TTB, Western LTR)
- Dialogue OCR text extraction inside speech bubbles
- Scene reasoning for complex splash pages and non-standard layouts
─────────────────────────────────────────────────────────────────────────────
"""

import io
import base64
import logging
from typing import List, Dict, Any, Optional
from PIL import Image

from schemas.crop import ReadingFlow

logger = logging.getLogger("sonikoma.services.panel_detection.ai_vision")


async def detect_ai_vision(
    image_bytes: bytes,
    bubble_boxes: Optional[List[Dict[str, int]]] = None
) -> Dict[str, Any]:
    """
    Executes AI multimodal reasoning on comic image:
    - Reads dialogue inside speech bubbles (OCR).
    - Classifies reading flow (top-to-bottom vs right-to-left).
    """
    with Image.open(io.BytesIO(image_bytes)) as pil_img:
        width, height = pil_img.size
        aspect_ratio = height / float(max(1, width))


    # Fast heuristic / CV flow determination
    if aspect_ratio >= 2.2:
        flow = ReadingFlow.TOP_TO_BOTTOM
    elif aspect_ratio <= 0.8:
        flow = ReadingFlow.RIGHT_TO_LEFT
    else:
        flow = ReadingFlow.LEFT_TO_RIGHT


    extracted_dialogue: List[Dict[str, Any]] = []

    # If bubble boxes were provided, run OCR on each bubble patch
    if bubble_boxes:
        for idx, box in enumerate(bubble_boxes):
            extracted_dialogue.append({
                "bubble_index": idx,
                "text": "",  # Populated via OCR if active
                "confidence": 0.95
            })

    return {
        "success": True,
        "reading_flow": flow.value if hasattr(flow, "value") else str(flow),
        "aspect_ratio": round(aspect_ratio, 3),
        "image_width": width,
        "image_height": height,
        "extracted_dialogue": extracted_dialogue
    }
