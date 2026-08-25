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
    DetectLongPanelsResponse,
    PanelBoundingBox
)
from services.image.utils.image_resolver import resolve_image_to_buffer
from services.image.panel_detection.panel_detector import (
    detect_vertical_strip_panels,
    _detect_bg_color_and_threshold,
    _subdivide_continuous_tall_art_panel,
    _detect_panels_webtoon
)
from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.speech_bubble_detector import detect_yolo_entities
from services.image.panel_detection.panel_fusion_service import fuse_panels_and_bubbles

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

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size

    logger.info(f"[LongPanels Detector] Starting Tri-Engine detection on {img_w}x{img_h}px image...")

    # ── ENGINE 1: YOLO Deep-Learning Speech Bubble & Entity Segmentation ──────
    # We run YOLO first so bubble locations guide and protect panel seam slicing
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

                chunk_bubbles = detect_yolo_entities(chunk_bytes, conf_threshold=0.25)
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
            logger.info(f"[LongPanels: YOLO] Sliding window detected {len(yolo_bubbles)} speech bubbles.")
        else:
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
            logger.info(f"[LongPanels: YOLO] Single-pass detected {len(yolo_bubbles)} speech bubbles.")
    except Exception as e:
        logger.warning(f"[LongPanels: YOLO] YOLO detection error: {e}", exc_info=True)

    yolo_ocr_boxes = [
        {"x": b.x, "y": b.y, "w": b.width, "h": b.height}
        for b in yolo_bubbles
    ]

    # ── ENGINE 2: OpenCV & Webtoon Adaptive Gutter Variance Slicing ───────────
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=0.15,
        min_height_px=request.min_panel_height,
        bleed_padding_px=request.bleed_padding_px
    )
    cv_panels = cv_res.get("panels", [])

    # Run horizontal projection valley segmenter guided by YOLO speech bubbles
    if (len(cv_panels) <= 1 or img_h > img_w * 2):
        try:
            import numpy as np
            from services.image.panel_detection.panel_detector import (
                detect_vertical_strip_panels,
                _detect_bg_color_and_threshold
            )
            gray_arr = np.array(pil_img.convert("L"))
            bg_res = _detect_bg_color_and_threshold(gray_arr, request.background_mode, request.sensitivity)
            is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res

            webtoon_res = detect_vertical_strip_panels(
                gray_arr=gray_arr,
                is_white_bg=is_white_bg,
                threshold_val=threshold_val,
                min_height_px=max(120, request.min_panel_height // 2),
                min_width_pct=0.10,
                ocr_boxes=yolo_ocr_boxes,
                median_bg=median_bg,
                sensitivity=request.sensitivity,
                top_median=top_med,
                bottom_median=bot_med,
                padding_px=request.bleed_padding_px
            )
            webtoon_boxes = webtoon_res.panels if hasattr(webtoon_res, "panels") else (webtoon_res[0] if isinstance(webtoon_res, tuple) else [])
            if webtoon_boxes:
                cv_panels = webtoon_boxes
                logger.info(f"[LongPanels: OpenCV] Webtoon gutter segmenter extracted {len(cv_panels)} panel seams (guided by {len(yolo_ocr_boxes)} bubbles).")
        except Exception as e:
            logger.warning(f"[LongPanels: OpenCV] Webtoon seam segmenter fallback: {e}", exc_info=True)

    # ── ENGINE 3: AI Vision Reading Flow & OCR (Optional Mode) ────────────────
    flow = "top_to_bottom"
    if request.engine_mode == "ai_vision":
        try:
            from services.image.panel_detection.ai_vision_detector import detect_ai_vision
            ai_res = await detect_ai_vision(raw_bytes)
            flow = ai_res.get("reading_flow", "top_to_bottom")
            logger.info(f"[LongPanels: AI Vision] Reading flow classified as '{flow}'.")
        except Exception as e:
            logger.warning(f"[LongPanels: AI Vision] Fallback: {e}")

    # ── SUBDIVIDE OVERSIZED COMPOSITE PANELS ──────────────────────────────────
    # Break down giant macro-boxes (e.g. >1500px tall continuous scenes) into natural panels
    try:
        from services.image.panel_detection.panel_detector import _subdivide_continuous_tall_art_panel
        import numpy as np
        gray_arr = np.array(pil_img.convert("L"))
        subdivided_cv: List[Dict[str, Any]] = []

        for p in cv_panels:
            px = int(p.get("x", 0))
            py = int(p.get("y", 0))
            pw = int(p.get("w", p.get("width", img_w)))
            ph = int(p.get("h", p.get("height", 100)))

            if ph > max(1500, int(pw * 2.2)):
                # Find speech bubbles inside this tall slice
                child_ocr = [
                    {"x": max(0, b.x - px), "y": max(0, b.y - py), "w": b.width, "h": b.height}
                    for b in yolo_bubbles
                    if py <= (b.y + b.height // 2) <= (py + ph)
                ]
                sub_gray = gray_arr[py : py + ph, px : px + pw]
                if sub_gray.shape[0] > 0 and sub_gray.shape[1] > 0:
                    sub_pieces = _subdivide_continuous_tall_art_panel(
                        sub_gray=sub_gray,
                        bx=px,
                        by=py,
                        bw=pw,
                        bh=ph,
                        child_ocr=child_ocr,
                        target_card_h=max(600, int(pw * 1.5))
                    )
                    for sp in sub_pieces:
                        subdivided_cv.append({
                            "x": px + sp.get("x", 0),
                            "y": py + sp.get("y", 0),
                            "w": sp.get("w", pw),
                            "h": sp.get("h", ph),
                            "confidence": p.get("confidence", 0.95),
                            "label": p.get("label", "panel")
                        })
                    continue

            subdivided_cv.append(p)

        if len(subdivided_cv) > len(cv_panels):
            logger.info(f"[LongPanels: Subdivider] Split oversized composite panels: {len(cv_panels)} -> {len(subdivided_cv)} panels.")
            cv_panels = subdivided_cv
    except Exception as e:
        logger.warning(f"[LongPanels: Subdivider] Fallback: {e}", exc_info=True)

    # ── FUSION: Bind Speech Bubbles into Panel Slices ─────────────────────────
    fused_panels, all_bubbles, _ = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        is_small_panel=False,
        bleed_padding_px=request.bleed_padding_px
    )

    # ── POST-PROCESSING: Deduplicate overlapping slices ───────────────────────
    try:
        from services.image.panel_detection.panel_detector import resolve_overlapping_panels_lineage
        raw_dicts = [p.model_dump() for p in fused_panels]
        cleaned_dicts = resolve_overlapping_panels_lineage(raw_dicts, iou_thresh=0.40)
        if cleaned_dicts and len(cleaned_dicts) != len(fused_panels):
            logger.info(f"[LongPanels: PostProcessor] Deduplicated {len(fused_panels)} -> {len(cleaned_dicts)} panels.")
            fused_panels = [
                PanelBoundingBox(**cd) for cd in cleaned_dicts
            ]
    except Exception as e:
        logger.warning(f"[LongPanels: PostProcessor] Fallback: {e}")

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[LongPanels Detector] Processed {img_w}x{img_h}px in {elapsed_ms}ms -> "
        f"Detected {len(fused_panels)} panels with {len(all_bubbles)} total speech bubbles via {request.engine_mode}."
    )

    return DetectLongPanelsResponse(
        success=True,
        crop_type="long_panels",
        engine_mode=request.engine_mode,
        total_panels=len(fused_panels),
        total_speech_bubbles_count=len(all_bubbles),
        image_width=img_w,
        image_height=img_h,
        reading_flow="top_to_bottom",
        panels=fused_panels,
        gutter_count=max(0, len(fused_panels) - 1),
        message=f"Detected {len(fused_panels)} panels in {elapsed_ms}ms."
    )
