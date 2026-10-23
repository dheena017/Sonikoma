"""
backend/features/image_editor/services/panel_detection/detect_composite_service.py
─────────────────────────────────────────────────────────────────────────────
Unified Composite Detection Service:
- Synchronous single-call pipeline for Panels + Speech Bubbles + Characters
- Spatial entity fusion: containment, speaker attribution, and cinematography
- Returns standardized DetectCompositeResponse scene graph
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import Optional, Dict, Any, List
from PIL import Image

from features.platform.projects.schemas_project import (
    DetectPanelsUrlRequest,
    DetectCompositeResponse,
    PanelBoundingBox,
    SpeechBubbleItem,
    CharacterEntityItem,
)
from common.media import resolve_image_to_buffer
from features.image_editor.services.panel_detection.opencv_detector import detect_opencv_panels
from features.image_editor.services.panel_detection.speech_bubble_detector import detect_speech_bubbles as detect_yolo_entities
from features.image_editor.services.panel_detection.detect_characters_service import detect_character_entities
from features.image_editor.services.panel_detection.panel_fusion_service import fuse_panels_and_bubbles

logger = logging.getLogger("sonikoma.services.image.panel_detection.composite")

__all__ = ["detect_composite_panels"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. Composite Multi-Entity Orchestration Engine
# ─────────────────────────────────────────────────────────────────────────────

async def detect_composite_panels(body: DetectPanelsUrlRequest) -> DetectCompositeResponse:
    """
    Executes unified composite detection on comic image bytes:
    1. Resolves image to in-memory bytes and normalizes color space.
    2. Runs OpenCV geometric panel contours.
    3. Runs YOLO deep-learning speech bubble detection.
    4. Runs YOLO/Saliency character & face detection.
    5. Fuses all entities into rich PanelBoundingBox models with speaker attribution.

    Args:
        body (DetectPanelsUrlRequest): Request containing image url or base64,
            plus YOLO toggles and contour parameters.

    Returns:
        DetectCompositeResponse: Full scene graph with panels, bubbles, characters,
            and cinematography tags.

    Raises:
        ValueError: If neither url nor base64 is provided or image is corrupt.
    """
    # ── Stage 1: Timing & Guard Clauses ───────────────────────────────────────
    start_time = time.perf_counter()

    if body is None:
        raise ValueError("No request payload provided.")

    target_url = body.url or body.image_url
    if not target_url and not body.image_base64:
        raise ValueError("Must provide 'url', 'image_url', or 'image_base64' for composite detection.")

    # ── Stage 2: Input Normalization & Buffer Resolution ──────────────────────
    raw_bytes: Optional[bytes] = None

    if target_url:
        try:
            resolved = await resolve_image_to_buffer(target_url)
            raw_bytes = resolved.get("data")
        except Exception as e:
            logger.error(f"[Composite Detector] Failed to resolve URL '{target_url}': {e}", exc_info=True)
            raise ValueError(f"Could not download image from URL: {e}")
    elif body.image_base64:
        b64 = body.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        try:
            raw_bytes = base64.b64decode(b64)
        except Exception as e:
            logger.error(f"[Composite Detector] Base64 decoding failed: {e}")
            raise ValueError(f"Invalid base64 payload: {e}")

    if not raw_bytes:
        raise ValueError("Resolved image buffer is empty (0 bytes).")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        img_w, img_h = pil_img.size
    except Exception as e:
        logger.error(f"[Composite Detector] Image parsing error: {e}")
        raise ValueError(f"Corrupt image payload: {e}")

    if img_w < 10 or img_h < 10:
        raise ValueError(f"Image dimensions too small ({img_w}x{img_h}px) for composite detection.")

    is_tall = img_h > img_w * 2

    # ── Stage 3: Core Algorithmic Processing ──────────────────────────────────

    # 1. OpenCV Contour Extraction
    cv_panels: List[Dict[str, Any]] = []
    try:
        cv_res = detect_opencv_panels(
            image_bytes=raw_bytes,
            min_width_pct=body.min_width_pct or 0.15,
            min_height_px=body.min_height_px or 60,
            bleed_padding_px=5,
        )
        cv_panels = cv_res.get("panels", [])
    except Exception as e:
        logger.warning(f"[Composite Detector] OpenCV contour extraction fallback: {e}")

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
        bleed_padding_px=5,
    )

    # 5. Extract Cinematography metadata list
    cinematography_list = [p.cinematography for p in fused_panels if p.cinematography]

    # ── Stage 4: Structured Output & Traceable Logging ────────────────────────
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[Composite Detector] Detected {len(fused_panels)} panel(s), {len(yolo_bubbles)} bubble(s), "
        f"and {len(characters)} character(s) in {elapsed_ms}ms (size={img_w}x{img_h}px)"
    )

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
        message=f"Detected {len(fused_panels)} panel(s), {len(yolo_bubbles)} bubble(s), and {len(characters)} character(s) in {elapsed_ms}ms",
    )
