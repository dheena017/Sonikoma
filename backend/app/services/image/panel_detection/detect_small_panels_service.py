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
from services.image.panel_detection.yolo_detector import detect_yolo_entities
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

    with Image.open(io.BytesIO(raw_bytes)) as pil_img:
        img_w, img_h = pil_img.size

    # 1. Run OpenCV frame detection
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=0.15,
        min_height_px=60,
        bleed_padding_px=request.bleed_padding_px
    )
    cv_panels = cv_res.get("panels", [])

    # 2. Run YOLO speech bubble detection
    yolo_bubbles = []
    if request.merge_speech_bubbles:
        try:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.30)
        except Exception as e:
            logger.warning(f"[SmallPanels Detector] YOLO detection fallback: {e}")

    # 3. Fuse panels and bind speech bubbles (with tight frame snapping)
    fused_panels, bound_bubbles, margins = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        is_small_panel=True,
        snap_to_frame=request.snap_to_frame,
        bleed_padding_px=request.bleed_padding_px
    )

    primary_panel = fused_panels[0] if fused_panels else None
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[SmallPanels Detector] Processed {img_w}x{img_h}px in {elapsed_ms}ms -> "
        f"Bound {len(bound_bubbles)} bubbles, Margins: {margins}"
    )

    return DetectSmallPanelsResponse(
        success=True,
        crop_type="small_panels",
        image_width=img_w,
        image_height=img_h,
        panel=primary_panel,
        panels=fused_panels,
        speech_bubbles=bound_bubbles,
        total_speech_bubbles_count=len(yolo_bubbles),
        bound_speech_bubbles_count=len(bound_bubbles),
        margins=margins,
        message=f"Detected tight frame in {elapsed_ms}ms with {len(bound_bubbles)} bound dialogue bubble(s)."
    )
