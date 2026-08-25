"""
backend/app/services/image/panel_detection/detect_long_panels_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Tall Webtoon Strips:
- Horizontal projection profile variance for gutter seam slicing
- Multi-panel sequence extraction with bleed guards (+5px)
- YOLO speech bubble binding across sequential panel slices
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from PIL import Image

from schemas.project import (
    DetectLongPanelsRequest,
    DetectLongPanelsResponse
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.yolo_detector import detect_yolo_entities
from services.image.panel_detection.panel_fusion_service import fuse_panels_and_bubbles
from services.image.panel_detection.webtoon_detector import _detect_panels_webtoon

logger = logging.getLogger("sonikoma.services.panel_detection.long_panels")


async def detect_long_panels_boxes(request: DetectLongPanelsRequest) -> DetectLongPanelsResponse:
    """
    Executes multi-panel detection on tall scrolling webtoon strips.
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
        raise ValueError("Could not resolve image data for long-panels detection.")

    with Image.open(io.BytesIO(raw_bytes)) as pil_img:
        img_w, img_h = pil_img.size

    # 1. Run OpenCV contour and gutter detection
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=0.15,
        min_height_px=request.min_panel_height,
        bleed_padding_px=request.bleed_padding_px
    )
    cv_panels = cv_res.get("panels", [])

    # If few OpenCV boxes found on tall strip, use projection gutter segmenter
    if len(cv_panels) <= 1 and img_h > img_w * 2:
        try:
            import numpy as np
            gray_arr = np.array(Image.open(io.BytesIO(raw_bytes)).convert("L"))
            res = _detect_panels_webtoon(
                gray_arr=gray_arr,
                bg_mode=request.background_mode,
                sensitivity=request.sensitivity,
                min_panel_height=request.min_panel_height,
                auto_split=request.auto_split
            )
            webtoon_boxes = res[0] if isinstance(res, tuple) else getattr(res, "panels", [])
            if webtoon_boxes:
                cv_panels = webtoon_boxes
        except Exception as e:
            logger.warning(f"[LongPanels Detector] Webtoon seam segmenter fallback: {e}")

    # 2. Run YOLO speech bubble detection (with sliding window for ultra-long strips)
    yolo_bubbles = []
    try:
        if img_h > 4000:
            # Ultra-Long Webtoon Strip: Sliding Window to maintain speech bubble resolution
            chunk_h = 3000
            overlap = 300
            step = chunk_h - overlap
            seen_bubbles = []
            
            for y_offset in range(0, img_h, step):
                box_top = y_offset
                box_bottom = min(img_h, y_offset + chunk_h)
                chunk_img = pil_img.crop((0, box_top, img_w, box_bottom))
                chunk_buf = io.BytesIO()
                chunk_img.save(chunk_buf, format="PNG")
                chunk_bytes = chunk_buf.getvalue()

                chunk_bubbles = detect_yolo_entities(chunk_bytes, conf_threshold=0.30)
                for cb in chunk_bubbles:
                    # Offset Y coordinate to absolute image coordinates
                    cb.y += box_top
                    if cb.polygon:
                        cb.polygon = [[pt[0], pt[1] + box_top] for pt in cb.polygon]
                    
                    # Deduplicate overlapping bubbles
                    is_dup = any(
                        abs(cb.x - prev.x) < 30 and abs(cb.y - prev.y) < 30
                        for prev in seen_bubbles
                    )
                    if not is_dup:
                        seen_bubbles.append(cb)
            
            seen_bubbles.sort(key=lambda b: (b.y, b.x))
            for idx, b in enumerate(seen_bubbles):
                b.bubble_id = f"bubble_{idx + 1}"
                b.reading_order = idx + 1
            yolo_bubbles = seen_bubbles
        else:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.30)
    except Exception as e:
        logger.warning(f"[LongPanels Detector] YOLO detection fallback: {e}")

    # 3. Fuse panels and assign bubbles to slices
    fused_panels, all_bubbles, _ = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        is_small_panel=False,
        bleed_padding_px=request.bleed_padding_px
    )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[LongPanels Detector] Processed {img_w}x{img_h}px in {elapsed_ms}ms -> "
        f"Detected {len(fused_panels)} panels with {len(all_bubbles)} total speech bubbles."
    )

    return DetectLongPanelsResponse(
        success=True,
        crop_type="long_panels",
        total_panels=len(fused_panels),
        total_speech_bubbles_count=len(all_bubbles),
        image_width=img_w,
        image_height=img_h,
        reading_flow="top_to_bottom",
        panels=fused_panels,
        gutter_count=max(0, len(fused_panels) - 1),
        message=f"Detected {len(fused_panels)} panels in {elapsed_ms}ms."
    )
