"""
backend/features/image_editor/services/detector/detect_small_panels_service.py
─────────────────────────────────────────────────────────────────────────────
API Service for Small Images & Single Frames:
- 1st classifies layout & reading flow via detect_type_service
- Delegates panel detection to main_service_detector.panel_detector
- Delegates speech bubble detection to main_service_detector.speech_bubble_detector
- Fuses panels and speech bubbles via panel_fusion_service
- Returns standardized DetectSmallPanelsResponse
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List

from features.platform.projects.schemas_project import (
    DetectSmallPanelsRequest,
    DetectSmallPanelsResponse,
    PanelBoundingBox,
    DetectMangaGridRequest,
    DetectSpeechBubblesRequest,
    DetectCharactersRequest,
)
from .detect_type_service import detect_image_layout_type
from .main_service_detector.panel_detector import (
    detect_panels_service,
    detect_manga_grid_service,
    DetectStripPanelsRequest,
)
from .main_service_detector.speech_bubble_detector import detect_speech_bubbles_service
from .main_service_detector.detect_characters_service import detect_characters_service
from .panel_fusion_service import fuse_panels_and_bubbles

logger = logging.getLogger("sonikoma.services.image.detector.small_panels")

__all__ = ["detect_small_panels"]


async def detect_small_panels(request: DetectSmallPanelsRequest) -> DetectSmallPanelsResponse:
    """
    Executes panel and dialogue detection on small comic images and single frames.
    1. First classifies image layout and format using detect_type_service.
    2. Runs main panel_detector service (manga grid or strip/frame).
    3. Runs main speech_bubble_detector service.
    4. Fuses speech bubbles and panel frame with tight snapping and margin calculation.
    """
    start_time = time.perf_counter()

    if not request.url and not request.image_base64:
        raise ValueError("Must provide either 'url' or 'image_base64' for small-panels detection.")

    # ── 1. First classify image layout & format ───────────────────────────────
    layout_info = await detect_image_layout_type(
        url=request.url,
        image_base64=request.image_base64,
    )
    logger.info(
        f"[SmallPanels API] 1st layout classified: '{layout_info.crop_type.value}' "
        f"({layout_info.type_label}, ratio={layout_info.aspect_ratio:.2f}, "
        f"bg={layout_info.detected_bg_color}, est_panels={layout_info.estimated_panel_count})"
    )

    img_w = layout_info.width
    img_h = layout_info.height

    # ── 2. Detect panels via main_service_detector.panel_detector ─────────────
    raw_panel_dicts: List[Dict[str, Any]] = []

    if layout_info.crop_type.value in ("multi_grid_page", "four_koma"):
        # Prioritize 2D manga grid decomposition
        grid_req = DetectMangaGridRequest(
            url=request.url,
            image_base64=request.image_base64,
            reading_flow=layout_info.reading_flow.value,
        )
        grid_res = await detect_manga_grid_service(grid_req)
        if grid_res.panels:
            raw_panel_dicts = [p.model_dump() for p in grid_res.panels]
            img_w = grid_res.image_width or img_w
            img_h = grid_res.image_height or img_h

    if not raw_panel_dicts:
        # Fall back to unified strip and frame panel detection
        strip_req = DetectStripPanelsRequest(
            url=request.url,
            image_base64=request.image_base64,
            min_width_pct=0.15,
            min_height_px=max(20, int(img_h * 0.05)),
            padding_px=request.bleed_padding_px,
        )
        strip_res = await detect_panels_service(strip_req)
        if strip_res.panels:
            raw_panel_dicts = [p.model_dump() for p in strip_res.panels]
            img_w = strip_res.image_width or img_w
            img_h = strip_res.image_height or img_h

    # Baseline panel if no sub-panels detected
    if not raw_panel_dicts:
        raw_panel_dicts = [{
            "id": "panel_1",
            "x": 0,
            "y": 0,
            "w": img_w,
            "h": img_h,
            "width": img_w,
            "height": img_h,
            "confidence": 0.95,
            "label": "panel_standard",
        }]

    # ── 3. Detect speech bubbles via main_service_detector.speech_bubble_detector
    yolo_bubbles = []
    if request.merge_speech_bubbles:
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
        logger.warning(f"[SmallPanels API] Character detector fallback: {e}")

    # ── 5. Multimodal Fusion: Bind speech bubbles & characters into panels ───
    fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=raw_panel_dicts,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        characters=characters,
        is_small_panel=True,
        snap_to_frame=request.snap_to_frame,
        bleed_padding_px=request.bleed_padding_px,
    )

    primary_panel = fused_panels[0] if fused_panels else None
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[SmallPanels API] Detected {len(fused_panels)} panel(s) and "
        f"{len(bound_bubbles)} bound bubble(s) in {elapsed_ms}ms"
    )

    return DetectSmallPanelsResponse(
        success=True,
        crop_type="small_panels",
        engine_mode=request.engine_mode,
        image_width=img_w,
        image_height=img_h,
        panel=primary_panel,
        panels=fused_panels,
        speech_bubbles=yolo_bubbles,
        total_speech_bubbles_count=len(yolo_bubbles),
        bound_speech_bubbles_count=len(bound_bubbles),
        margins=margins,
        message=f"Detected {len(fused_panels)} panel(s) with {len(bound_bubbles)} bound bubble(s) in {elapsed_ms}ms",
    )
