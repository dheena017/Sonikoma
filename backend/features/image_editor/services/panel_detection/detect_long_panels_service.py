"""
backend/features/image_editor/services/panel_detection/detect_long_panels_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Tall Webtoon Strips:
- Horizontal projection profile variance for gutter seam slicing
- Adaptive sliding-window YOLO bubble detection for ultra-long chapter scrolls
- Subdivides continuous tall art panels along natural low-density valleys
- Bleed guards (+5px) and pre-fusion overlap resolution
- Returns standardized DetectLongPanelsResponse with reading order
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import Any, Dict, List, Optional
import numpy as np
from PIL import Image

from features.platform.projects.schemas_project import (
    DetectLongPanelsRequest,
    DetectLongPanelsResponse,
    PanelBoundingBox,
)
from common.media import resolve_image_to_buffer
from features.image_editor.services.panel_detection.panel_detector import (
    detect_vertical_strip_panels,
    detect_background_color_and_threshold,
    detect_vertical_subgutters,
    subdivide_continuous_tall_art_panel,
    resolve_overlapping_panels,
)
from features.image_editor.services.panel_detection.opencv_detector import detect_opencv_panels
from features.image_editor.services.panel_detection.speech_bubble_detector import detect_speech_bubbles as detect_yolo_entities
from features.image_editor.services.panel_detection.panel_fusion_service import fuse_panels_and_bubbles
from features.image_editor.services.panel_detection.ai_vision_detector import detect_ai_vision

logger = logging.getLogger("sonikoma.services.image.panel_detection.long_panels")

__all__ = ["detect_long_panels"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. Tall Webtoon & Vertical Scrolling Strip Detection Engine
# ─────────────────────────────────────────────────────────────────────────────

async def detect_long_panels(request: DetectLongPanelsRequest) -> DetectLongPanelsResponse:
    """
    Executes multi-panel detection on tall scrolling webtoon strips and chapter scrolls.

    Args:
        request (DetectLongPanelsRequest): Request containing image url or base64,
            plus sensitivity, background mode, min height, and auto-split settings.

    Returns:
        DetectLongPanelsResponse: Standardized response with detected panel bounding boxes,
            speech bubbles, gutter count, and reading flow.

    Raises:
        ValueError: If neither 'url' nor 'image_base64' is provided, or image data is corrupt.
    """
    # ── Stage 1: Timing & Guard Clauses ───────────────────────────────────────
    start_time = time.perf_counter()

    if not request.url and not request.image_base64:
        raise ValueError("Must provide either 'url' or 'image_base64' for long-panels detection.")

    # ── Stage 2: Input Normalization & Buffer Resolution ──────────────────────
    raw_bytes: Optional[bytes] = None

    if request.url:
        try:
            resolved = await resolve_image_to_buffer(request.url)
            raw_bytes = resolved.get("data")
        except Exception as e:
            logger.error(f"[LongPanels] Failed to resolve URL '{request.url}': {e}", exc_info=True)
            raise ValueError(f"Could not download image from URL: {e}")
    elif request.image_base64:
        b64 = request.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        try:
            raw_bytes = base64.b64decode(b64)
        except Exception as e:
            logger.error(f"[LongPanels] Base64 decoding failed: {e}")
            raise ValueError(f"Invalid base64 payload: {e}")

    if not raw_bytes:
        raise ValueError("Resolved image buffer is empty (0 bytes).")

    try:
        pil_img = Image.open(io.BytesIO(raw_bytes))
        if pil_img.mode != "RGB":
            pil_img = pil_img.convert("RGB")
        img_w, img_h = pil_img.size
    except Exception as e:
        logger.error(f"[LongPanels] Image parsing error: {e}")
        raise ValueError(f"Corrupt image payload: {e}")

    if img_w < 10 or img_h < 10:
        raise ValueError(f"Image dimensions too small ({img_w}x{img_h}px) for strip detection.")

    aspect_ratio = img_h / float(max(1, img_w))
    gray_arr = np.array(pil_img.convert("L"))

    logger.info(
        f"[LongPanels Detector] Starting Tri-Engine detection on {img_w}x{img_h}px image "
        f"(aspect_ratio={aspect_ratio:.2f}, mode={request.engine_mode})..."
    )

    # ── Stage 3: Core Algorithmic Processing ──────────────────────────────────

    # ── Engine 1: YOLO Deep-Learning Speech Bubble & Entity Segmentation ──────
    yolo_bubbles = []
    try:
        if img_h > int(img_w * 2.0):
            # Ultra-Long Webtoon Strip: Adaptive chunks maintaining optimal aspect ratio (~1:1.5 to 1:1.75)
            if img_w < 600:
                chunk_h = max(300, int(img_w * 2.5))
            else:
                chunk_h = min(2200, max(1000, int(img_w * 1.6)))
            overlap = max(10, int(chunk_h * 0.25))
            step = max(20, chunk_h - overlap)
            seen_bubbles = []
            max_chunks = int(img_h // step) + 5
            chunks_processed = 0

            for y_offset in range(0, img_h, step):
                if chunks_processed >= max_chunks:
                    break
                box_top = y_offset
                box_bottom = min(img_h, y_offset + chunk_h)
                chunk_img = pil_img.crop((0, box_top, img_w, box_bottom))

                chunk_bubbles = detect_yolo_entities(chunk_img, conf_threshold=0.25)
                chunks_processed += 1
                for cb in chunk_bubbles:
                    cb.y += box_top
                    if cb.polygon:
                        cb.polygon = [[pt[0], pt[1] + box_top] for pt in cb.polygon]

                    # Deduplicate overlapping bubbles across chunk seams
                    dup_tol = max(6, int(img_w * 0.05))
                    is_dup = any(
                        abs(cb.x - prev.x) < dup_tol and abs(cb.y - prev.y) < dup_tol
                        for prev in seen_bubbles
                    )
                    if not is_dup:
                        seen_bubbles.append(cb)

            seen_bubbles.sort(key=lambda b: (b.y, b.x))
            for idx, b in enumerate(seen_bubbles):
                b.bubble_id = f"bubble_{idx + 1}"
                b.reading_order = idx + 1
            yolo_bubbles = seen_bubbles
            logger.info(
                f"[LongPanels: YOLO] Sliding window detected {len(yolo_bubbles)} "
                f"speech bubbles across {chunks_processed} chunks."
            )
        else:
            yolo_bubbles = detect_yolo_entities(pil_img, conf_threshold=0.25)
            logger.info(f"[LongPanels: YOLO] Single-pass detected {len(yolo_bubbles)} speech bubbles.")
    except Exception as e:
        logger.warning(f"[LongPanels: YOLO] Bubble detection fallback: {e}", exc_info=True)

    yolo_ocr_boxes = [
        {"x": b.x, "y": b.y, "w": b.width, "h": b.height}
        for b in yolo_bubbles
    ]

    # ── Engine 2: OpenCV & Webtoon Adaptive Gutter Variance Slicing ───────────
    cv_res = detect_opencv_panels(
        image_bytes=pil_img,
        min_width_pct=0.15,
        min_height_px=request.min_panel_height,
        bleed_padding_px=request.bleed_padding_px,
    )
    cv_panels = cv_res.get("panels", [])

    is_white_bg = True
    threshold_val = 220
    # If OpenCV found no frames (e.g. completely borderless scroll), fall back to gutter segmenter
    if len(cv_panels) <= 1:
        try:
            bg_res = detect_background_color_and_threshold(gray_arr, request.background_mode, request.sensitivity)
            is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res

            webtoon_res = detect_vertical_strip_panels(
                gray_arr=gray_arr,
                is_white_bg=is_white_bg,
                threshold_val=threshold_val,
                min_height_px=max(160, int(request.min_panel_height)),
                min_width_pct=0.10,
                ocr_boxes=yolo_ocr_boxes,
                median_bg=median_bg,
                sensitivity=request.sensitivity,
                top_median=top_med,
                bottom_median=bot_med,
                padding_px=request.bleed_padding_px,
            )
            webtoon_boxes = (
                webtoon_res.panels
                if hasattr(webtoon_res, "panels")
                else (webtoon_res[0] if isinstance(webtoon_res, tuple) else [])
            )
            if webtoon_boxes:
                cv_panels = webtoon_boxes
                logger.info(f"[LongPanels: OpenCV] Webtoon gutter segmenter extracted {len(cv_panels)} panel seams.")
        except Exception as e:
            logger.warning(f"[LongPanels: OpenCV] Webtoon seam segmenter fallback: {e}", exc_info=True)

    # ── Engine 3: AI Vision Reading Flow & OCR (Optional Mode) ────────────────
    flow = "top_to_bottom"
    if request.engine_mode == "ai_vision":
        try:
            ai_res = await detect_ai_vision(raw_bytes)
            flow = ai_res.get("reading_flow", "top_to_bottom")
            logger.info(f"[LongPanels: AI Vision] Reading flow classified as '{flow}'.")
        except Exception as e:
            logger.warning(f"[LongPanels: AI Vision] Fallback: {e}")

    # ── Subdivide Oversized Composite Panels & 2D Manga Grids ─────────────────
    if request.auto_split:
        try:
            subdivided_cv: List[Dict[str, Any]] = []
            is_webtoon_scroll = (request.background_mode != "manga_grid") or (img_h > img_w * 1.5)

            for p in cv_panels:
                px = int(p.get("x", 0))
                py = int(p.get("y", 0))
                pw = int(p.get("w", p.get("width", img_w)))
                ph = int(p.get("h", p.get("height", 100)))

                if ph < int(img_w * 0.20):
                    subdivided_cv.append(p)
                    continue

                if is_webtoon_scroll:
                    # Check if this horizontal slice contains side-by-side panels (2-column layouts)
                    sub_gray = gray_arr[py : py + ph, px : px + pw]
                    has_subcols = False
                    if sub_gray.shape[0] > 0 and sub_gray.shape[1] > 0 and pw >= int(img_w * 0.70):
                        sub_cols = detect_vertical_subgutters(
                            sub_gray, is_white_bg=True, threshold_val=220, median_bg=255.0
                        )
                        if len(sub_cols) > 1:
                            has_subcols = True
                            for col_idx, (cx1, cx2) in enumerate(sub_cols):
                                cw = cx2 - cx1
                                if cw >= max(10, int(pw * 0.15)):
                                    subdivided_cv.append({
                                        "x": px + cx1,
                                        "y": py,
                                        "w": cw,
                                        "h": ph,
                                        "confidence": p.get("confidence", 0.95),
                                        "label": "panel_col",
                                    })

                    if has_subcols:
                        continue

                    # In Webtoon strips, subdivide exceptionally tall continuous art scenes along valley seams
                    if ph > int(pw * 2.8) or (ph > int(img_w * 2.2) and ph > int(pw * 2.0)):
                        child_ocr = [
                            {"x": max(0, b.x - px), "y": max(0, b.y - py), "w": b.width, "h": b.height}
                            for b in yolo_bubbles
                            if py <= (b.y + b.height // 2) <= (py + ph)
                        ]
                        if sub_gray.shape[0] > 0 and sub_gray.shape[1] > 0:
                            sub_pieces = subdivide_continuous_tall_art_panel(
                                sub_gray, px, py, pw, ph, child_ocr
                            )
                            for piece in sub_pieces:
                                piece_h = piece.get("h", ph)
                                if piece_h >= max(15, int(pw * 0.15)):
                                    subdivided_cv.append({
                                        "x": px,
                                        "y": py + piece.get("y", 0),
                                        "w": pw,
                                        "h": piece_h,
                                        "confidence": p.get("confidence", 0.95),
                                        "label": "webtoon_subpanel",
                                    })
                        else:
                            subdivided_cv.append({
                                "x": px,
                                "y": py,
                                "w": pw,
                                "h": ph,
                                "confidence": p.get("confidence", 0.95),
                                "label": "panel",
                            })
                    else:
                        subdivided_cv.append({
                            "x": px,
                            "y": py,
                            "w": pw,
                            "h": ph,
                            "confidence": p.get("confidence", 0.95),
                            "label": p.get("label", "panel"),
                        })
                else:
                    # Non-webtoon (print 2D Manga grid) pages with closed bordered frames
                    page_crop = pil_img.crop((px, py, px + pw, py + ph))
                    cv_grid = detect_opencv_panels(
                        page_crop,
                        min_width_pct=0.20,
                        min_height_px=max(int(pw * 0.12), int(ph * 0.08)),
                        bleed_padding_px=request.bleed_padding_px,
                    )
                    sub_panels = cv_grid.get("panels", [])

                    total_covered_h = 0
                    if sub_panels:
                        min_sub_y = min(sp.get("y", 0) for sp in sub_panels)
                        max_sub_y2 = max(sp.get("y", 0) + sp.get("h", 0) for sp in sub_panels)
                        total_covered_h = max_sub_y2 - min_sub_y

                    valid_grid = (len(sub_panels) > 1) and (total_covered_h >= int(ph * 0.70))

                    if valid_grid:
                        cleaned_subs: List[Dict[str, Any]] = []
                        sub_panels.sort(key=lambda sp: (sp.get("y", 0), sp.get("x", 0)))
                        for sp in sub_panels:
                            sp_x = px + sp.get("x", 0)
                            sp_y = py + sp.get("y", 0)
                            sp_w = sp.get("w", pw)
                            sp_h = sp.get("h", ph)

                            if sp_w < max(50, int(pw * 0.15)) or sp_h < max(40, int(ph * 0.05)):
                                continue

                            if cleaned_subs:
                                last = cleaned_subs[-1]
                                last_y2 = last["y"] + last["h"]
                                last_x2 = last["x"] + last["w"]

                                ix1 = max(last["x"], sp_x)
                                iy1 = max(last["y"], sp_y)
                                ix2 = min(last_x2, sp_x + sp_w)
                                iy2 = min(last_y2, sp_y + sp_h)

                                inter_w = max(0, ix2 - ix1)
                                inter_h = max(0, iy2 - iy1)
                                inter_area = inter_w * inter_h
                                min_area = min(last["w"] * last["h"], sp_w * sp_h)

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
                                "label": p.get("label", "panel"),
                            })
                        subdivided_cv.extend(cleaned_subs)
                    else:
                        subdivided_cv.append(p)

            if len(subdivided_cv) > 0:
                cv_panels = subdivided_cv
        except Exception as e:
            logger.warning(f"[LongPanels: Subdivider] Fallback: {e}", exc_info=True)

    # ── PRE-FUSION: Resolve overlapping cv_panels before bubble fusion ────────
    if len(cv_panels) > 1:
        cv_panels_pre = sorted(cv_panels, key=lambda p: (int(p.get("y") or 0), int(p.get("x") or 0)))
        for _i in range(len(cv_panels_pre) - 1):
            p1 = cv_panels_pre[_i]
            p2 = cv_panels_pre[_i + 1]
            p1_y1 = int(p1.get("y") or 0)
            p1_h = int(p1.get("h") or p1.get("height") or 0)
            p1_y2 = p1_y1 + p1_h
            p2_y1 = int(p2.get("y") or 0)

            p1_x1 = int(p1.get("x") or 0)
            p1_x2 = p1_x1 + int(p1.get("w") or p1.get("width") or 0)
            p2_x1 = int(p2.get("x") or 0)
            p2_x2 = p2_x1 + int(p2.get("w") or p2.get("width") or 0)
            x_overlap = min(p1_x2, p2_x2) - max(p1_x1, p2_x1)

            # Only resolve vertical overlap if panels share horizontal space
            if p1_y2 > p2_y1 and x_overlap > max(15, int(img_w * 0.05)):
                overlap = p1_y2 - p2_y1
                boundary = p2_y1 + (overlap // 2)
                try:
                    if gray_arr is not None:
                        overlap_band = gray_arr[p2_y1:p1_y2, :]
                        if overlap_band.shape[0] > 0 and overlap_band.shape[1] > 1:
                            row_diffs = np.abs(np.diff(overlap_band.astype(float), axis=1))
                            row_strokes = np.sum(row_diffs > 18.0, axis=1)
                            row_stds = np.std(overlap_band, axis=1)
                            best_rel_y = int(np.argmin(row_strokes * 2.0 + row_stds))
                            boundary = p2_y1 + best_rel_y
                except Exception:
                    boundary = p2_y1 + (overlap // 2)

                boundary = max(p2_y1, min(p1_y2, boundary))
                new_h1 = boundary - p1_y1
                p2_orig_y2 = p2_y1 + int(p2.get("h") or p2.get("height") or 0)
                new_h2 = p2_orig_y2 - boundary

                if new_h1 < 100 or new_h2 < 100:
                    p2["x"] = min(p1_x1, p2_x1)
                    p2["y"] = min(p1_y1, p2_y1)
                    p2["w"] = p2["width"] = max(p1_x2, p2_x2) - p2["x"]
                    p2["h"] = p2["height"] = max(p1_y2, p2_orig_y2) - p2["y"]
                    p1["h"] = p1["height"] = 0
                    continue

                p1["h"] = max(10, new_h1)
                if "height" in p1:
                    p1["height"] = max(10, new_h1)
                p2["y"] = boundary
                p2["h"] = max(10, new_h2)
                if "height" in p2:
                    p2["height"] = max(10, new_h2)

        cv_panels = [p for p in cv_panels_pre if int(p.get("h") or p.get("height") or 0) >= 60]

    # ── Multimodal Fusion: Bind Speech Bubbles into Panel Slices ──────────────
    fused_panels, all_bubbles, _ = fuse_panels_and_bubbles(
        cv_panels=cv_panels,
        yolo_bubbles=yolo_bubbles,
        img_w=img_w,
        img_h=img_h,
        is_small_panel=False,
        bleed_padding_px=request.bleed_padding_px,
    )

    # ── Post-Processing: Resolve Overlapping Slices & Blank Gutters ───────────
    try:
        raw_dicts = [p.model_dump() for p in fused_panels]
        cleaned_dicts = resolve_overlapping_panels(raw_dicts, iou_thresh=0.40)
        if cleaned_dicts:
            min_h_thresh = max(120, int(request.min_panel_height * 0.70))
            valid_dicts = []
            for cd in cleaned_dicts:
                cw = int(cd.get("w", 0))
                ch = int(cd.get("h", 0))
                cx = int(cd.get("x", 0))
                cy = int(cd.get("y", 0))
                has_bubbles = len(cd.get("speech_bubbles") or []) > 0

                if cw < max(50, int(img_w * 0.15)):
                    continue
                if ch < min_h_thresh and not has_bubbles:
                    continue

                # Filter out pure blank canvas gutter slices between panels
                if ch >= 40 and cw >= 40:
                    patch = gray_arr[cy : cy + ch, cx : cx + cw]
                    if patch.size > 0:
                        patch_std = float(np.std(patch))
                        if is_white_bg:
                            bg_match_pct = float(np.mean(patch >= (threshold_val - 8)))
                        else:
                            bg_match_pct = float(np.mean(patch <= (threshold_val + 8)))
                        if bg_match_pct >= 0.90 and patch_std < 8.0 and not has_bubbles:
                            continue

                valid_dicts.append(cd)

            fused_panels = [
                PanelBoundingBox(**cd) for cd in (valid_dicts if valid_dicts else cleaned_dicts)
            ]
            for idx, p in enumerate(fused_panels):
                p.index = idx
                p.id = f"panel_{idx + 1}"
    except Exception as e:
        logger.warning(f"[LongPanels: PostProcessor] Deduplication fallback: {e}")

    # ── Stage 4: Structured Output & Traceable Logging ────────────────────────
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)

    logger.info(
        f"[LongPanels Detector] Successfully extracted {len(fused_panels)} panel(s) and "
        f"{len(all_bubbles)} bubble(s) in {elapsed_ms}ms (size={img_w}x{img_h}px, mode={request.engine_mode})"
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
        message=f"Detected {len(fused_panels)} panels in {elapsed_ms}ms.",
    )


# Backward-compatible alias
detect_long_panels_boxes = detect_long_panels
