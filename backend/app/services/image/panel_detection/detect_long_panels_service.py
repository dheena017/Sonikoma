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
    aspect_ratio = img_h / float(max(1, img_w))

    logger.info(f"[LongPanels Detector] Starting Tri-Engine detection on {img_w}x{img_h}px image (aspect_ratio={aspect_ratio:.2f})...")
    logger.debug(
        f"[LongPanels Detector] Parameters: min_panel_height={request.min_panel_height}, "
        f"sensitivity={request.sensitivity}, background_mode={request.background_mode}, "
        f"auto_split={request.auto_split}, engine_mode={request.engine_mode}, bleed={request.bleed_padding_px}px"
    )

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
            logger.debug(f"[LongPanels: YOLO] Image height {img_h}px > 4000px; activating sliding window chunking (chunk_h={chunk_h}, overlap={overlap}, step={step})...")
            
            for y_offset in range(0, img_h, step):
                box_top = y_offset
                box_bottom = min(img_h, y_offset + chunk_h)
                logger.debug(f"[LongPanels: YOLO] Processing window slice: y=[{box_top}..{box_bottom}]")
                chunk_img = pil_img.crop((0, box_top, img_w, box_bottom))
                chunk_buf = io.BytesIO()
                chunk_img.save(chunk_buf, format="PNG")
                chunk_bytes = chunk_buf.getvalue()

                chunk_bubbles = detect_yolo_entities(chunk_bytes, conf_threshold=0.25)
                logger.debug(f"[LongPanels: YOLO] Window y=[{box_top}..{box_bottom}] yielded {len(chunk_bubbles)} raw bubble(s)")
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
                    else:
                        logger.debug(f"[LongPanels: YOLO] Deduplicating overlap bubble at ({cb.x},{cb.y})")
            
            seen_bubbles.sort(key=lambda b: (b.y, b.x))
            for idx, b in enumerate(seen_bubbles):
                b.bubble_id = f"bubble_{idx + 1}"
                b.reading_order = idx + 1
            yolo_bubbles = seen_bubbles
            logger.info(f"[LongPanels: YOLO] Sliding window detected {len(yolo_bubbles)} speech bubbles.")
        else:
            logger.debug(f"[LongPanels: YOLO] Running single-pass YOLO entity detection on {len(raw_bytes)} raw bytes...")
            yolo_bubbles = detect_yolo_entities(raw_bytes, conf_threshold=0.25)
            logger.info(f"[LongPanels: YOLO] Single-pass detected {len(yolo_bubbles)} speech bubbles.")
        
        for bi, b in enumerate(yolo_bubbles):
            logger.debug(f"[LongPanels: YOLO Bubble #{bi+1}] id={b.bubble_id}, pos=({b.x},{b.y},{b.width},{b.height}), conf={b.confidence:.2f}")
    except Exception as e:
        logger.warning(f"[LongPanels: YOLO] YOLO detection error: {e}", exc_info=True)

    yolo_ocr_boxes = [
        {"x": b.x, "y": b.y, "w": b.width, "h": b.height}
        for b in yolo_bubbles
    ]

    # ── ENGINE 2: OpenCV & Webtoon Adaptive Gutter Variance Slicing ───────────
    logger.debug(f"[LongPanels: OpenCV] Running detect_opencv_boxes (min_width_pct=0.15, min_height={request.min_panel_height})...")
    cv_res = detect_opencv_boxes(
        image_bytes=raw_bytes,
        min_width_pct=0.15,
        min_height_px=request.min_panel_height,
        bleed_padding_px=request.bleed_padding_px
    )
    cv_panels = cv_res.get("panels", [])
    logger.debug(f"[LongPanels: OpenCV] detect_opencv_boxes yielded {len(cv_panels)} candidate panel(s)")

    # Run horizontal projection valley segmenter guided by YOLO speech bubbles
    if (len(cv_panels) <= 1 or img_h > img_w * 2):
        logger.debug(f"[LongPanels: OpenCV] Triggering vertical strip valley segmenter (panels_count={len(cv_panels)}, aspect_ratio={aspect_ratio:.2f})...")
        try:
            import numpy as np
            from services.image.panel_detection.panel_detector import (
                detect_vertical_strip_panels,
                _detect_bg_color_and_threshold
            )
            gray_arr = np.array(pil_img.convert("L"))
            bg_res = _detect_bg_color_and_threshold(gray_arr, request.background_mode, request.sensitivity)
            is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res
            logger.debug(f"[LongPanels: OpenCV] Background analysis: is_white={is_white_bg}, thresh={threshold_val}, median_bg={median_bg}, bg_std={bg_std:.2f}")

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
                for wbi, wb in enumerate(cv_panels):
                    logger.debug(f"[LongPanels: Seam #{wbi+1}] x={wb.get('x')}, y={wb.get('y')}, w={wb.get('w')}, h={wb.get('h')}")
        except Exception as e:
            logger.warning(f"[LongPanels: OpenCV] Webtoon seam segmenter fallback: {e}", exc_info=True)

    # ── ENGINE 3: AI Vision Reading Flow & OCR (Optional Mode) ────────────────
    flow = "top_to_bottom"
    if request.engine_mode == "ai_vision":
        logger.debug("[LongPanels: AI Vision] Classifying reading flow via AI multimodal detector...")
        try:
            from services.image.panel_detection.ai_vision_detector import detect_ai_vision
            ai_res = await detect_ai_vision(raw_bytes)
            flow = ai_res.get("reading_flow", "top_to_bottom")
            logger.info(f"[LongPanels: AI Vision] Reading flow classified as '{flow}'.")
        except Exception as e:
            logger.warning(f"[LongPanels: AI Vision] Fallback: {e}")

    # ── SUBDIVIDE OVERSIZED COMPOSITE PANELS & 2D MANGA GRIDS ─────────────────
    # Break down macro-page slices into individual separate comic panel frames
    if request.auto_split:
        try:
            import numpy as np
            gray_arr = np.array(pil_img.convert("L"))
            subdivided_cv: List[Dict[str, Any]] = []

            for p in cv_panels:
                px = int(p.get("x", 0))
                py = int(p.get("y", 0))
                pw = int(p.get("w", p.get("width", img_w)))
                ph = int(p.get("h", p.get("height", 100)))

                if ph < int(img_w * 0.20):
                    subdivided_cv.append(p)
                    continue

                # Crop sub-slice for internal 2D panel grid detection
                page_crop = pil_img.crop((px, py, px + pw, py + ph))
                buf = io.BytesIO()
                page_crop.save(buf, format="PNG")
                page_bytes = buf.getvalue()

                cv_grid = detect_opencv_boxes(
                    page_bytes,
                    min_width_pct=0.20,
                    min_height_px=max(int(pw * 0.12), int(ph * 0.08)),
                    bleed_padding_px=request.bleed_padding_px
                )
                sub_panels = cv_grid.get("panels", [])

                # Determine whether page slice has multiple distinct closed 2D panels
                # Check total vertical coverage of detected sub-panels
                total_covered_h = 0
                if sub_panels:
                    min_sub_y = min(sp.get("y", 0) for sp in sub_panels)
                    max_sub_y2 = max(sp.get("y", 0) + sp.get("h", 0) for sp in sub_panels)
                    total_covered_h = max_sub_y2 - min_sub_y

                # Only use sub-panels if they cover >= 70% of the slice or if ph is short
                valid_grid = (len(sub_panels) > 1) and (total_covered_h >= int(ph * 0.70) or ph <= int(pw * 2.0))

                if valid_grid:
                    # Successfully extracted individual panel frames from this page
                    # Only merge sub-panels that are true duplicate / subset contours, NEVER vertically stacked panels
                    cleaned_subs: List[Dict[str, Any]] = []
                    sub_panels.sort(key=lambda sp: (sp.get("y", 0), sp.get("x", 0)))
                    for sp in sub_panels:
                        sp_x = px + sp.get("x", 0)
                        sp_y = py + sp.get("y", 0)
                        sp_w = sp.get("w", pw)
                        sp_h = sp.get("h", ph)

                        # Filter out tiny sliver noise (e.g. < 40px width/height)
                        if sp_w < max(50, int(pw * 0.15)) or sp_h < max(40, int(ph * 0.05)):
                            continue

                        if cleaned_subs:
                            last = cleaned_subs[-1]
                            last_y2 = last["y"] + last["h"]
                            last_x2 = last["x"] + last["w"]

                            # Check 2D intersection / overlap
                            ix1 = max(last["x"], sp_x)
                            iy1 = max(last["y"], sp_y)
                            ix2 = min(last_x2, sp_x + sp_w)
                            iy2 = min(last_y2, sp_y + sp_h)
                            
                            inter_w = max(0, ix2 - ix1)
                            inter_h = max(0, iy2 - iy1)
                            inter_area = inter_w * inter_h
                            min_area = min(last["w"] * last["h"], sp_w * sp_h)

                            # ONLY merge if they are essentially the same box (overlap >= 70% of smaller box)
                            if min_area > 0 and (inter_area / float(min_area)) >= 0.70:
                                last["x"] = min(last["x"], sp_x)
                                last["y"] = min(last["y"], sp_y)
                                last["w"] = max(last_x2, sp_x + sp_w) - last["x"]
                                last["h"] = max(last_y2, sp_y + sp_h) - last["y"]
                                continue

                        cleaned_subs.append({
                            "x": sp_x,
                            "y": sp_y,
                            "w": sp_w,
                            "h": sp_h,
                            "confidence": p.get("confidence", 0.95),
                            "label": p.get("label", "panel")
                        })
                    subdivided_cv.extend(cleaned_subs)
                elif ph > int(pw * 1.35):
                    # Continuous tall webtoon strip without closed borders: subdivide at natural whitespace / gradient valleys
                    from services.image.panel_detection.panel_detector import _subdivide_continuous_tall_art_panel
                    child_ocr = [
                        {"x": max(0, b.x - px), "y": max(0, b.y - py), "w": b.width, "h": b.height}
                        for b in yolo_bubbles
                        if py <= (b.y + b.height // 2) <= (py + ph)
                    ]
                    sub_gray = gray_arr[py : py + ph, px : px + pw]
                    if sub_gray.shape[0] > 0 and sub_gray.shape[1] > 0:
                        sub_pieces = _subdivide_continuous_tall_art_panel(
                            sub_gray, px, py, pw, ph, child_ocr
                        )
                        for piece in sub_pieces:
                            subdivided_cv.append({
                                "x": px + piece.get("x", 0),
                                "y": py + piece.get("y", 0),
                                "w": piece.get("w", pw),
                                "h": piece.get("h", ph),
                                "confidence": p.get("confidence", 0.95),
                                "label": "webtoon_subpanel"
                            })
                    else:
                        subdivided_cv.append(p)
                else:
                    subdivided_cv.append(p)

            if len(subdivided_cv) > len(cv_panels):
                logger.info(f"[LongPanels: Subdivider] Split composite slices into separate panels: {len(cv_panels)} -> {len(subdivided_cv)} panels.")
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
        if cleaned_dicts:
            # Filter out tiny noise slivers (e.g., logo watermarks or border artifacts)
            valid_dicts = [
                cd for cd in cleaned_dicts
                if int(cd.get("w", 0)) >= max(50, int(img_w * 0.25)) and int(cd.get("h", 0)) >= 50
            ]
            fused_panels = [
                PanelBoundingBox(**cd) for cd in (valid_dicts if valid_dicts else cleaned_dicts)
            ]
            for idx, p in enumerate(fused_panels):
                p.index = idx
                p.id = f"panel_{idx + 1}"
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
