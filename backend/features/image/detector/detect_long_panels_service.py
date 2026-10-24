"""
backend/features/image_editor/services/detector/detect_long_panels_service.py
─────────────────────────────────────────────────────────────────────────────
API Service for Tall Webtoon Strips & Continuous Scrolls:
- 1st classifies layout & reading flow via detect_type_service
- Delegates panel detection to main_service_detector.panel_detector
- Delegates dialogue balloon detection to main_service_detector.speech_bubble_detector
- Fuses panels and speech bubbles via panel_fusion_service
- Returns standardized DetectLongPanelsResponse
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List

from features.platform.projects.schemas_project import (
    DetectLongPanelsRequest,
    DetectLongPanelsResponse,
    DetectSpeechBubblesRequest,
    DetectCharactersRequest,
)
from .detect_type_service import detect_image_layout_type
from .main_service_detector.panel_detector import (
    detect_panels_service,
    DetectStripPanelsRequest,
)
from .main_service_detector.speech_bubble_detector import detect_speech_bubbles_service
from .main_service_detector.detect_characters_service import detect_characters_service
from .panel_fusion_service import fuse_panels_and_bubbles

logger = logging.getLogger("sonikoma.services.image.detector.long_panels")

__all__ = ["detect_long_panels", "detect_long_panels_boxes"]


async def detect_long_panels(request: DetectLongPanelsRequest) -> DetectLongPanelsResponse:
    """
    Executes panel detection on tall scrolling webtoon strips and chapter scrolls.
    1. First classifies image layout and format using detect_type_service.
    2. Runs main panel_detector service.
    3. Runs main speech_bubble_detector service.
    4. Fuses speech bubbles and panels with safe bleed padding and reading order.
    """
    start_time = time.perf_counter()

    if not request.url and not request.image_base64:
        raise ValueError("Must provide either 'url' or 'image_base64' for long-panels detection.")

    # ── 1. First classify image layout & reading flow ─────────────────────────
    layout_info = await detect_image_layout_type(
        url=request.url,
        image_base64=request.image_base64,
    )
    logger.info(
        f"[LongPanels API] 1st layout classified: '{layout_info.crop_type.value}' "
        f"({layout_info.type_label}, ratio={layout_info.aspect_ratio:.2f}, "
        f"bg={layout_info.detected_bg_color}, est_panels={layout_info.estimated_panel_count})"
    )

    # ── 2. Detect panels via main_service_detector.panel_detector ─────────────
    strip_req = DetectStripPanelsRequest(
        url=request.url,
        image_base64=request.image_base64,
        sensitivity=request.sensitivity,
        background_mode=request.background_mode,
        min_height_px=request.min_panel_height,
        padding_px=request.bleed_padding_px,
    )
    panel_res = await detect_panels_service(strip_req)
    raw_panel_dicts = [p.model_dump() for p in panel_res.panels]
    img_w = panel_res.image_width or layout_info.width
    img_h = panel_res.image_height or layout_info.height

    # ── 3. Detect speech bubbles via main_service_detector.speech_bubble_detector
    bubble_req = DetectSpeechBubblesRequest(
        url=request.url,
        image_base64=request.image_base64,
        conf_threshold=0.25,
        detect_chat_ui=True,
    )
    bubble_res = await detect_speech_bubbles_service(bubble_req)
    yolo_bubbles = getattr(bubble_res, "bubbles", None) or getattr(bubble_res, "speech_bubbles", None) or []

    # ── 4. Detect characters via main_service_detector.detect_characters_service
    characters = []
    try:
        char_req = DetectCharactersRequest(
            url=request.url,
            image_base64=request.image_base64,
            conf_threshold=0.25,
            detect_faces=True,
        )
        char_res = await detect_characters_service(char_req)
        characters = char_res.characters or []
    except Exception as e:
        logger.warning(f"[LongPanels API] Character detector fallback: {e}")

    # ── 5. Multimodal Fusion: Bind speech bubbles & characters into panels ───
    fused_panels, all_bubbles, _ = fuse_panels_and_bubbles(
        cv_panels=raw_panel_dicts,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        characters=characters,
        is_small_panel=False,
        bleed_padding_px=request.bleed_padding_px,
    )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(
        f"[LongPanels API] Successfully extracted {len(fused_panels)} panel(s) and "
        f"{len(all_bubbles)} bubble(s) in {elapsed_ms}ms"
    )

    return DetectLongPanelsResponse(
        success=True,
        crop_type="long_panels",
        engine_mode=request.engine_mode,
        total_panels=len(fused_panels),
        total_speech_bubbles_count=len(all_bubbles),
        image_width=img_w,
        image_height=img_h,
        reading_flow=layout_info.reading_flow.value if layout_info else "top_to_bottom",
        panels=fused_panels,
        gutter_count=max(0, len(fused_panels) - 1),
        message=f"Detected {len(fused_panels)} panels in {elapsed_ms}ms.",
    )


# Backward-compatible alias
detect_long_panels_boxes = detect_long_panels
