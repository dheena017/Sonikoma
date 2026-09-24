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
import numpy as np
from PIL import Image

from schemas.project import (
    DetectSmallPanelsRequest,
    DetectSmallPanelsResponse,
    PanelBoundingBox
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
    aspect_ratio = img_h / float(max(1, img_w))

    logger.info(f"[SmallPanels Detector] Starting Tri-Engine detection on {img_w}x{img_h}px image (aspect_ratio={aspect_ratio:.3f})...")

    # ── ENGINE 1: YOLO Deep-Learning Speech Bubble Detection ──────────────────
    # Run YOLO first so dialogue positions guide panel frame boundaries
    yolo_bubbles = []
    if request.merge_speech_bubbles:
        try:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
            logger.info(f"[SmallPanels: YOLO] Detected {len(yolo_bubbles)} speech bubble(s).")
        except Exception as e:
            logger.warning(f"[SmallPanels: YOLO] YOLO detection fallback: {e}", exc_info=True)

    yolo_ocr_boxes = [
        {"x": b.x, "y": b.y, "w": b.width, "h": b.height}
        for b in yolo_bubbles
    ]

    # ── ENGINE 2: Webtoon Gutter Slicing & 2D Manga Grid Detection ───────────
    prop_min_h = max(20, int(img_h * 0.05))
    cv_panels = []

    # Check for horizontal webtoon gutter seams first if image is tall or square-ish
    if aspect_ratio >= 1.0:
        try:
            from services.image.panel_detection.panel_detector import (
                detect_vertical_strip_panels,
                _detect_bg_color_and_threshold
            )
            gray_arr = np.array(pil_img.convert("L"))
            bg_res = _detect_bg_color_and_threshold(gray_arr, "auto", 30.0)
            is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res

            res = detect_vertical_strip_panels(
                gray_arr=gray_arr,
                is_white_bg=is_white_bg,
                threshold_val=threshold_val,
                min_height_px=max(80, prop_min_h),
                min_width_pct=0.20,
                ocr_boxes=yolo_ocr_boxes,
                median_bg=median_bg,
                sensitivity=30.0,
                top_median=top_med,
                bottom_median=bot_med,
                enable_x_trimming=False,
                enable_column_split=False
            )
            webtoon_boxes = res.panels if hasattr(res, "panels") else (res[0] if isinstance(res, tuple) else [])
            if webtoon_boxes and len(webtoon_boxes) >= 2:
                cv_panels = webtoon_boxes
                logger.info(f"[SmallPanels: Gutter] Extracted {len(cv_panels)} horizontal webtoon panel seams.")
        except Exception as e:
            logger.warning(f"[SmallPanels: Gutter] Webtoon seam segmenter fallback: {e}")

    # If no multi-panel horizontal gutters, try 2D Manga grid for print manga pages
    if not cv_panels and 0.6 <= aspect_ratio <= 1.6:
        try:
            from services.image.panel_detection.grid_detector import detect_manga_grid_panels
            gray_arr = np.array(pil_img.convert("L"))
            grid_boxes = detect_manga_grid_panels(gray_arr, min_width_pct=0.15, min_height_px=prop_min_h)
            if grid_boxes and len(grid_boxes) >= 2:
                # Reject false vertical column cuts spanning full height
                is_false_columns = any(
                    int(gb.get("h", 0)) >= int(img_h * 0.75) and int(gb.get("w", 0)) < int(img_w * 0.60)
                    for gb in grid_boxes
                )
                if not is_false_columns:
                    cv_panels = grid_boxes
                    logger.info(f"[SmallPanels: Grid] Extracted {len(cv_panels)} Manga 2D grid panel(s).")
        except Exception as e:
            logger.warning(f"[SmallPanels: Grid] Grid detector fallback: {e}")

    # Fallback to OpenCV contour detection if still <= 1 panel
    if not cv_panels:
        cv_res = detect_opencv_boxes(
            image_bytes=raw_bytes,
            min_width_pct=0.15,
            min_height_px=prop_min_h,
            bleed_padding_px=request.bleed_padding_px
        )
        candidate_panels = cv_res.get("panels", [])
        # Filter out false vertical column cuts
        cv_panels = [
            cp for cp in candidate_panels
            if not (int(cp.get("h", 0)) >= int(img_h * 0.80) and int(cp.get("w", 0)) < int(img_w * 0.60))
        ]

    # If no distinct sub-panels, create a clean full-canvas baseline panel enclosing all speech bubbles
    if not cv_panels:
        cv_panels = [{
            "id": "panel_1",
            "x": 0,
            "y": 0,
            "w": img_w,
            "h": img_h,
            "width": img_w,
            "height": img_h,
            "confidence": 0.95,
            "label": "panel_standard"
        }]

    logger.info(f"[SmallPanels: Detected] Total candidate frames: {len(cv_panels)}")

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

    # ── POST-PROCESSING: Resolve any micro-panel noise & deduplication ────────
    try:
        from services.image.panel_detection.panel_detector import resolve_overlapping_panels_lineage
        raw_dicts = [p.model_dump() for p in fused_panels]
        cleaned_dicts = resolve_overlapping_panels_lineage(raw_dicts, iou_thresh=0.40)
        if cleaned_dicts:
            fused_panels = [
                PanelBoundingBox(**cd) for cd in cleaned_dicts
            ]
            for idx, p in enumerate(fused_panels):
                p.index = idx
                p.id = f"panel_{idx + 1}"
    except Exception as e:
        logger.warning(f"[SmallPanels: PostProcessor] Fallback: {e}")

    primary_panel = fused_panels[0] if fused_panels else None
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[SmallPanels Detector] Detected {len(fused_panels)} panel(s) and {len(bound_bubbles)} bound bubble(s) in {elapsed_ms}ms (size={img_w}x{img_h}px, mode={request.engine_mode})"
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
        message=f"Detected {len(fused_panels)} panel(s) with {len(bound_bubbles)} bound bubble(s) via {request.engine_mode} in {elapsed_ms}ms"
    )
