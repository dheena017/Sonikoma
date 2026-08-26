"""
backend/app/services/image/panel_detection/detect_composite_service.py
─────────────────────────────────────────────────────────────────────────────
Unified Composite Detection Service:
- Synchronous single-call pipeline for Panels + Speech Bubbles + Characters
- Calculates character containment, speaker attribution, and cinematography
- Returns DetectCompositeResponse
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import Optional, Dict, Any, List
from PIL import Image

from schemas.project import (
    DetectPanelsUrlRequest,
    DetectCompositeResponse,
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.speech_bubble_detector import detect_yolo_entities
from services.image.panel_detection.detect_characters_service import detect_character_entities
from services.image.panel_detection.panel_fusion_service import fuse_panels_and_bubbles

logger = logging.getLogger("sonikoma.services.panel_detection.composite")


async def detect_composite_boxes(body: DetectPanelsUrlRequest) -> DetectCompositeResponse:
    """
    Executes unified composite detection on comic image bytes:
    1. Resolves image to in-memory bytes.
    2. Runs OpenCV geometric contours.
    3. Runs YOLO speech bubble detection.
    4. Runs YOLO/Saliency character & face detection.
    5. Fuses all entities into rich PanelBoundingBox models with speaker attribution.
    """
    start_time = time.perf_counter()

    raw_bytes = None
    target_url = body.url or body.image_url
    if target_url:
        resolved = await resolve_image_to_buffer(target_url)
        raw_bytes = resolved.get("data")
    elif body.image_base64:
        b64 = body.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        raise ValueError("Must provide 'url', 'image_url', or 'image_base64'.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    is_tall = img_h > img_w * 2

    # 1. OpenCV Contour Extraction
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=body.min_width_pct or 0.15,
        min_height_px=body.min_height_px or 60,
        bleed_padding_px=5
    )
    cv_panels = cv_res.get("panels", [])

    # 2. YOLO Speech Bubble Detection
    yolo_bubbles: List[SpeechBubbleItem] = []
    if body.use_yolo:
        try:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
        except Exception as e:
            logger.warning(f"[Composite Detector] YOLO bubbles fallback: {e}")

    # 3. Character & Face Detection
    characters: List[CharacterEntityItem] = []
    try:
        characters = detect_character_entities(raw_bytes, conf_threshold=0.25, detect_faces=True)
    except Exception as e:
        logger.warning(f"[Composite Detector] Characters fallback: {e}")

    # 4. Intelligent Multimodal Fusion
    fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        characters=characters,
        is_small_panel=not is_tall,
        snap_to_frame=True,
        bleed_padding_px=5
    )

    # 5. Extract Cinematography metadata list
    cinematography_list = [p.cinematography for p in fused_panels if p.cinematography]

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    return DetectCompositeResponse(
        success=True,
        crop_type="tall_strip" if is_tall else "small_panels",
        image_width=img_w,
        image_height=img_h,
        reading_flow="top_to_bottom",
        panels=fused_panels,
        speech_bubbles=yolo_bubbles,
        characters=characters,
        cinematography=cinematography_list if cinematography_list else None,
        total_panels=len(fused_panels),
        total_speech_bubbles=len(yolo_bubbles),
        total_characters=len(characters),
        execution_time_ms=elapsed_ms,
        message=f"Detected {len(fused_panels)} panel(s), {len(yolo_bubbles)} bubble(s), and {len(characters)} character(s) in {elapsed_ms}ms"
    )
