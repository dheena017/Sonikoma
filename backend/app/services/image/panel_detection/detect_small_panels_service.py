"""
backend/app/services/image/panel_detection/detect_small_panels_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Small Images & Single Comic Frames:
- Tight frame snapping (snaps to black borders, drops trailing white space & SFX)
- Speech bubble binding (attaches nearby dialogue into the artwork card)
- Returns DetectSmallPanelsResponse with precise directional margins
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from PIL import Image

from schemas.project import (
    DetectSmallPanelsRequest,
    DetectSmallPanelsResponse
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.speech_bubble_detector import detect_yolo_entities
from services.image.panel_detection.panel_fusion_service import fuse_panels_and_bubbles

logger = logging.getLogger("sonikoma.services.panel_detection.small_panels")


async def detect_small_panels_boxes(request: DetectSmallPanelsRequest) -> DetectSmallPanelsResponse:
    """
    Executes detection on small comic images / single frames:
    1. Resolves image to in-memory bytes.
    2. Runs OpenCV contour & tight frame analysis.
    3. Runs YOLO speech bubble detection.
    4. Fuses dialogue bubbles into the panel frame.
    5. Discards bottom white space and loose gutter SFX ("RATTLE").
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
        raise ValueError("Could not resolve image data for small-panels detection.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    logger.info(f"[SmallPanels Detector] Starting Tri-Engine detection on {img_w}x{img_h}px image...")

    # ── ENGINE 1: OpenCV Geometric Contours & 2D Manga Grid Detection ────────
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=0.15,
        min_height_px=60,
        bleed_padding_px=request.bleed_padding_px
    )
    cv_panels = cv_res.get("panels", [])

    # If standard 2D Manga grid page, run Manga grid detector
    if len(cv_panels) <= 1 and 0.6 <= (img_h / float(max(1, img_w))) <= 2.2:
        try:
            from services.image.panel_detection.grid_detector import detect_manga_grid_panels
            gray_arr = np.array(pil_img.convert("L"))
            grid_boxes = detect_manga_grid_panels(gray_arr, min_width_pct=0.15, min_height_px=60)
            if grid_boxes and len(grid_boxes) > len(cv_panels):
                cv_panels = grid_boxes
                logger.info(f"[SmallPanels: Grid] Extracted {len(cv_panels)} Manga 2D grid panel(s).")
        except Exception as e:
            logger.warning(f"[SmallPanels: Grid] Grid detector fallback: {e}")

    logger.info(f"[SmallPanels: OpenCV] Total candidate frames: {len(cv_panels)}")

    # ── ENGINE 2: YOLO Deep-Learning Speech Bubble Detection ──────────────────
    yolo_bubbles = []
    if request.merge_speech_bubbles:
        try:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
            logger.info(f"[SmallPanels: YOLO] Detected {len(yolo_bubbles)} speech bubble(s).")
        except Exception as e:
            logger.warning(f"[SmallPanels: YOLO] YOLO detection fallback: {e}", exc_info=True)

    # ── ENGINE 3: AI Vision Reading Flow & Text Analysis (Optional Mode) ─────
    ai_flow = "left_to_right"
    if request.engine_mode == "ai_vision":
        try:
            from services.image.panel_detection.ai_vision_detector import detect_ai_vision
            ai_res = await detect_ai_vision(raw_bytes)
            ai_flow = ai_res.get("reading_flow", "left_to_right")
            logger.info(f"[SmallPanels: AI Vision] Flow: {ai_flow}")
        except Exception as e:
            logger.warning(f"[SmallPanels: AI Vision] Fallback: {e}")

    # ── FUSION: Bind speech bubbles & calculate tight margins ────────────────
    fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        is_small_panel=True,
        snap_to_frame=request.snap_to_frame,
        bleed_padding_px=request.bleed_padding_px
    )

    # ── POST-PROCESSING: Resolve any micro-panel noise ───────────────────────
    try:
        from services.image.panel_detection.panel_detector import resolve_overlapping_panels_lineage
        raw_dicts = [p.model_dump() for p in fused_panels]
        cleaned_dicts = resolve_overlapping_panels_lineage(raw_dicts, iou_thresh=0.40)
        if len(cleaned_dicts) == len(fused_panels):
            for idx, cd in enumerate(cleaned_dicts):
                fused_panels[idx].x = cd.get("x", fused_panels[idx].x)
                fused_panels[idx].y = cd.get("y", fused_panels[idx].y)
                fused_panels[idx].w = cd.get("w", fused_panels[idx].w)
                fused_panels[idx].h = cd.get("h", fused_panels[idx].h)
    except Exception as e:
        logger.warning(f"[SmallPanels: PostProcessor] Fallback: {e}")

    primary_panel = fused_panels[0] if fused_panels else None
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

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
        message=f"Detected {len(fused_panels)} panel(s) with {len(bound_bubbles)} bound bubble(s) via {request.engine_mode} in {elapsed_ms}ms"
    )
