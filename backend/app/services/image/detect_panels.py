"""
backend/app/services/image/detect_panels.py
─────────────────────────────────────────────────────────────────────────────
Lightweight facade coordinator for panel detection. Exposes run_cv_detection
while delegating core algorithms to sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Optional, Any, Union, Tuple
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_CV = True
except ImportError:
    cv2 = None  # type: ignore
    HAS_CV = False


# Import helper sub-modules
from services.image.utils.panel_box_utils import (
    adjust_to_aspect_ratio,
    merge_overlapping_boxes
)
from services.image.panel_webtoon_detect import (
    _detect_bg_color_and_threshold,
    _detect_panels_webtoon
)
from services.image.panel_grid_detect import (
    _detect_panels_grid_cv,
    _detect_panels_grid_pil
)
from services.image.utils.panel_image_utils import (
    trim_solid_borders,
    _filter_solid_noise
)

logger = logging.getLogger("sonikoma.services.detect_panels")


def _sort_panels_reading_order(panels: List[Dict[str, Any]], reading_order: str = "ltr") -> List[Dict[str, Any]]:
    """
    Sorts comic & webtoon panels into true 2D visual reading order.
    Groups panels into horizontal visual rows (with adaptive height tolerance),
    then sorts each row left-to-right (LTR) or right-to-left (RTL).
    Top-to-bottom row sequence is strictly preserved.
    """
    if not panels:
        return panels

    sorted_by_y = sorted(panels, key=lambda b: (b.get("y", 0), b.get("x", 0)))
    
    rows: List[List[Dict[str, Any]]] = []
    for panel in sorted_by_y:
        py = panel.get("y", 0)
        ph = panel.get("height", 0)
        
        placed = False
        for row in rows:
            row_y_min = min(p.get("y", 0) for p in row)
            row_y_max = max(p.get("y", 0) for p in row)
            row_avg_h = sum(p.get("height", 0) for p in row) / float(len(row))
            
            row_tolerance = max(30.0, row_avg_h * 0.40)
            
            if abs(py - row_y_min) <= row_tolerance or abs(py - row_y_max) <= row_tolerance:
                row.append(panel)
                placed = True
                break
                
        if not placed:
            rows.append([panel])
            
    is_rtl = reading_order.lower() == "rtl"
    ordered_panels: List[Dict[str, Any]] = []
    
    for row in rows:
        sorted_row = sorted(row, key=lambda b: -b.get("x", 0) if is_rtl else b.get("x", 0))
        ordered_panels.extend(sorted_row)
        
    return ordered_panels


def run_cv_detection(
    # ── Required ──────────────────────────────────────────────────────────────
    image_path: str,
    sensitivity: float,
    bg_mode: str,
    min_width_pct: float,
    min_height_px: int,
    merge_threshold: int,
    aspect_ratio_str: str,
    # ── OpenCV / Canny edge detection ─────────────────────────────────────────
    canny_low: int = 10,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    # ── General detection behaviour ───────────────────────────────────────────
    auto_split: bool = True,
    padding_px: int = 10,
    min_panel_area: float = 5000.0,
    # ── Tall-strip / Webtoon heuristics ──────────────────────────────────────
    tall_strip_ratio: float = 1.7,          # h/w ratio threshold to enter webtoon mode
    gutter_bg_ratio: float = 0.55,          # min background fraction for a gutter row
    gutter_std_thresh: float = 8.0,         # row std below which a row is "flat"
    gutter_flat_bg_ratio: float = 0.45,     # min bg ratio for flat rows to count as gutters
    # ── Noise / solid-box filtering ───────────────────────────────────────────
    max_aspect_ratio: float = 10.0,         # w/h above this → discard as horizontal strip
    min_aspect_ratio: float = 0.1,          # w/h below this → discard as vertical strip
    noise_std_thresh: float = 5.0,          # pixel std-dev below this → solid colour noise
    flat_row_ratio: float = 0.80,           # fraction of flat rows above this → solid band
    # ── OCR / speech-bubble snapping ──────────────────────────────────────────
    ocr_snap_distance_px: int = 150,        # max vertical gap (px) to snap a bubble to a panel
    ocr_snap_pct: float = 0.40,             # max snap gap as fraction of panel height
    # ── Preprocessing ─────────────────────────────────────────────────────────
    enable_clahe: bool = False,             # apply CLAHE equalisation before detection
    clahe_clip_limit: float = 2.0,          # CLAHE clip limit (higher = more contrast)
    clahe_tile_grid: int = 8,               # CLAHE tile grid size
    bilateral_d: int = 0,                   # bilateral filter diameter; 0 = disabled
    bilateral_sigma: float = 75.0,          # bilateral filter colour/space sigma
    # ── Reading order & output control ───────────────────────────────────────
    reading_order: str = "ltr",             # "ltr" (western) or "rtl" (manga right-to-left)
    min_confidence: float = 0.0,            # discard panels below this confidence (0.0-1.0)
    max_panels: int = 0,                    # max panels to return; 0 = unlimited
    # ── Deduplication thresholds ──────────────────────────────────────────────
    dedup_overlap_thresh: float = 0.70,     # IoU-style vertical overlap to treat as duplicate
    dedup_crop_tolerance: float = 4.0,      # max cropTop/Bottom diff (%) to treat as duplicate
    # ── Irregular panel / high-sensitivity retry ──────────────────────────────
    irregular_aspect_high: float = 5.0,     # w/h above this triggers high-sensitivity retry
    irregular_aspect_low: float = 0.2,      # w/h below this triggers high-sensitivity retry
    # ── Fallback segment override ─────────────────────────────────────────────
    fallback_segments: int = 0,             # manual fallback segment count; 0 = auto
    # ── YOLO ──────────────────────────────────────────────────────────────────
    use_yolo: bool = True,
    yolo_conf: float = 0.20,
) -> List[Dict[str, Any]]:

    """
    Main orchestration function for panel detection. Loads the image, runs background
    detection, routes to the appropriate detection strategy (Webtoon Slicing vs. Grid Contours),
    performs YOLO deep learning box fusion, noise filtering, overlap merging, padding, and scaling.

    All tunable parameters have sensible defaults so existing callers need no changes.

    Key tuning parameters:
      ── Preprocessing ─────────────────────────────────────────────────────────
      enable_clahe         – apply CLAHE contrast equalisation before detection
      clahe_clip_limit     – CLAHE clip limit, higher = more contrast boost (default 2.0)
      clahe_tile_grid      – CLAHE tile grid size in pixels (default 8)
      bilateral_d          – bilateral filter diameter; 0 = disabled (default 0)
      bilateral_sigma      – bilateral filter colour+space sigma (default 75.0)
      ── Reading order & output ────────────────────────────────────────────────
      reading_order        – "ltr" (western, left-to-right) or "rtl" (manga, right-to-left)
      min_confidence       – discard panels below this confidence score 0.0–1.0 (default 0.0)
      max_panels           – cap on number of returned panels; 0 = unlimited (default 0)
      ── Deduplication ─────────────────────────────────────────────────────────
      dedup_overlap_thresh – vertical IoU above which a panel is a duplicate (default 0.70)
      dedup_crop_tolerance – max cropTop/Bottom % difference for duplicate (default 4.0)
      ── Irregular fallback ────────────────────────────────────────────────────
      irregular_aspect_high – w/h above this ratio triggers high-sensitivity retry (default 5.0)
      irregular_aspect_low  – w/h below this ratio triggers high-sensitivity retry (default 0.2)
      fallback_segments    – override auto fallback segment count; 0 = auto (default 0)
      ── Webtoon heuristics ────────────────────────────────────────────────────
      tall_strip_ratio     – h/w above which webtoon slicing is used (default 1.7)
      gutter_bg_ratio      – fraction of background pixels for a gutter row (default 0.55)
      gutter_std_thresh    – row pixel std below which a row is flat (default 8.0)
      gutter_flat_bg_ratio – bg ratio for flat rows to count as gutters (default 0.45)
      ── Noise filtering ───────────────────────────────────────────────────────
      max_aspect_ratio     – w/h limit above which a box is discarded as noise (default 10.0)
      min_aspect_ratio     – w/h limit below which a box is discarded as noise (default 0.1)
      noise_std_thresh     – pixel std below which a box is solid-colour noise (default 5.0)
      flat_row_ratio       – flat-row fraction above which a box is a solid band (default 0.80)
      ── OCR snapping ──────────────────────────────────────────────────────────
      ocr_snap_distance_px – max vertical px gap to snap a speech bubble to a panel (default 150)
      ocr_snap_pct         – max snap gap as fraction of panel height (default 0.40)
    """
    logger.info(f"[Panel Detection] Starting local panel detection on {image_path} (use_yolo={use_yolo})")
    
    has_cv = HAS_CV and cv2 is not None

    gray_arr: Optional[np.ndarray] = None
    img: Optional[Any] = None
    orig_w: int = 0
    orig_h: int = 0

    if has_cv and cv2 is not None:
        img = cv2.imread(image_path)
        if img is None:
            return []
        orig_h, orig_w, c = img.shape
        if orig_h == 0 or orig_w == 0:
            return []
        gray_arr = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        try:
            pil_img = Image.open(image_path)
        except Exception:
            return []

        orig_w, orig_h = pil_img.size
        if orig_w == 0 or orig_h == 0:
            return []
        gray_arr = np.array(pil_img.convert("L"))

    if gray_arr is None:
        return []

    # Optional Preprocessing: CLAHE & Bilateral Filter
    if has_cv and cv2 is not None:
        if enable_clahe:
            clahe = cv2.createCLAHE(clipLimit=clahe_clip_limit, tileGridSize=(clahe_tile_grid, clahe_tile_grid))
            gray_arr = clahe.apply(gray_arr)
        if bilateral_d > 0:
            gray_arr = cv2.bilateralFilter(gray_arr, bilateral_d, bilateral_sigma, bilateral_sigma)

    # Dynamic Parameter Scaling
    ref_area = 1500.0 * 1500.0
    img_area = float(orig_w * orig_h)
    aspect_strip = float(orig_h) / float(max(1, orig_w))
    if aspect_strip > 1.5:
        scale_factor = max(0.5, min(2.0, float(orig_w) / 1200.0))
    else:
        scale_factor = max(0.5, min(2.0, (img_area / ref_area) ** 0.5))

    scaled_min_height_px = max(15, min(120, int(min_height_px * scale_factor)))
    scaled_min_width_pct = max(0.05, min(0.25, min_width_pct * (0.5 + 0.5 * scale_factor)))
    scaled_close_kernel = max(3, min(40, int(close_kernel_size * scale_factor)))

    # Speech Bubble Protection (OCR)
    # Skip OCR when YOLO is enabled — YOLO already detects speech bubbles/balloons and
    # populates ocr_boxes below, so running EasyOCR here too is redundant and causes
    # multi-minute hangs on tall CPU-only strips (e.g. 57 tiles × ~3s each = 3+ min).
    # Also skip for very large images (>4 MP) on CPU to prevent accidental hangs.
    _OCR_MAX_PIXELS = 4_000_000  # ~2000×2000 — safe upper bound for CPU OCR during detection
    ocr_boxes: List[Dict[str, int]] = []
    yolo_panel_candidates: List[Dict[str, Union[int, float]]] = []

    _run_ocr_for_protection = (
        not use_yolo and
        (orig_w * orig_h) <= _OCR_MAX_PIXELS
    )

    if _run_ocr_for_protection:
        try:
            import asyncio
            from services.image.ocr import extract_full_ocr_data
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(lambda: asyncio.run(extract_full_ocr_data(image_path)))
                    ocr_results = future.result()
            else:
                ocr_results = loop.run_until_complete(extract_full_ocr_data(image_path))

            for res in ocr_results:
                pts = np.array(res["box"], dtype=np.int32)
                if has_cv and cv2 is not None:
                    bx, by, bw, bh = cv2.boundingRect(pts)
                else:
                    xs = [pt[0] for pt in res["box"]]
                    ys = [pt[1] for pt in res["box"]]
                    bx, by, bw, bh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
                ocr_boxes.append({"x": bx, "y": by, "w": bw, "h": bh})
        except Exception as e:
            logger.warning(f"[Panel Detection] Failed to retrieve OCR bounds for speech bubble protection: {e}")
    else:
        reason = "YOLO enabled (bubble detection handled below)" if use_yolo else f"image too large for CPU OCR ({orig_w}×{orig_h}px)"
        logger.debug(f"[Panel Detection] Skipping OCR bubble protection: {reason}")

    # YOLO AI Object & Speech Bubble Detection + Panel Candidate Extraction
    if use_yolo:
        try:
            from providers.vision.yolo import get_yolo_model
            yolo_model = get_yolo_model()
            if yolo_model is not None:
                is_tall_strip_image = orig_h > 2000 and (float(orig_h) / float(max(1, orig_w)) > 1.5)

                # ── Detect whether this is a bubble-specialist model ───────────────
                # Generic COCO models detect person/car/etc — don't treat unknown classes as bubbles.
                # Bubble-specialist models (kitsumed/ogkalu) have very few classes, all bubble-related.
                _model_names = getattr(yolo_model, "names", {}) or {}
                _num_classes = len(_model_names)
                _is_bubble_specialist = _num_classes <= 5  # kitsumed=1 class, ogkalu=1-2 classes

                # ── Build tile list ───────────────────────────────────────────────
                # Use a larger tile height to give YOLO more context and reduce seam misses.
                # Overlap at 25% of tile height to catch objects spanning tile boundaries.
                tiles: List[Tuple[int, int]] = []
                if is_tall_strip_image:
                    # Target ~2x image width, clamped 1200–2000px — balances quality vs memory
                    tile_h = min(2000, max(1200, int(orig_w * 2.5)))
                    overlap = max(250, tile_h // 4)   # 25% overlap minimum
                    step = tile_h - overlap
                    for y_start in range(0, orig_h, step):
                        y_end = min(orig_h, y_start + tile_h)
                        tiles.append((y_start, y_end))
                        if y_end >= orig_h:
                            break
                else:
                    tiles.append((0, orig_h))

                # ── Open PIL image once for tile cropping (avoid per-tile re-open) ─
                _pil_full = None
                if is_tall_strip_image and not (has_cv and img is not None):
                    try:
                        _pil_full = Image.open(image_path)
                    except Exception:
                        pass

                # ── Separate confidence thresholds ────────────────────────────────
                # Bubbles: we want high recall (lower conf), panels: we want high precision
                _bubble_conf = max(0.10, yolo_conf - 0.05)  # slightly more permissive
                _panel_conf  = max(yolo_conf, 0.25)         # stricter for panel candidates

                yolo_count = 0
                min_w_px = int(orig_w * scaled_min_width_pct)

                # Raw lists before deduplication
                _raw_bubble_boxes: List[Dict] = []
                _raw_panel_boxes:  List[Dict] = []

                for y_start, y_end in tiles:
                    if is_tall_strip_image:
                        if has_cv and img is not None:
                            tile_src = img[y_start:y_end, :]
                        elif _pil_full is not None:
                            tile_src = _pil_full.crop((0, y_start, orig_w, y_end))
                        else:
                            tile_src = image_path
                    else:
                        tile_src = image_path

                    try:
                        raw_results = yolo_model.predict(
                            tile_src,
                            conf=_bubble_conf,   # use lower conf — we'll filter panels separately
                            iou=0.45,            # tighter NMS within a single tile (default 0.7 is too loose)
                            verbose=False,
                            agnostic_nms=True,   # class-agnostic NMS handles multi-class bubble overlap
                        )
                        results = list(raw_results) if raw_results is not None else []
                    except Exception as pred_err:
                        logger.debug(f"[Panel Detection] Tile prediction warning ({y_start}-{y_end}): {pred_err}")
                        continue

                    if not results:
                        continue
                    result = results[0]
                    boxes = getattr(result, "boxes", None)
                    if boxes is None:
                        continue

                    for box_instance in boxes:  # type: ignore
                        coords = box_instance.xyxy[0].cpu().numpy()
                        conf_score = float(box_instance.conf[0].cpu().numpy()) if box_instance.conf is not None else 0.8
                        bx1, by1, bx2, by2 = float(coords[0]), float(coords[1]), float(coords[2]), float(coords[3])

                        # Reproject tile-local coordinates back to full image space
                        by1 += y_start
                        by2 += y_start
                        bx, by, bw, bh = int(bx1), int(by1), int(bx2 - bx1), int(by2 - by1)

                        cls_id = int(box_instance.cls[0].cpu().numpy()) if hasattr(box_instance, "cls") and box_instance.cls is not None else 0
                        cls_name = _model_names.get(cls_id, "").lower() if _model_names else ""

                        # ── Class routing ─────────────────────────────────────────
                        # Bubble detection: explicit class names OR unknown class on specialist models
                        _is_named_bubble = (
                            "bubble" in cls_name or
                            "balloon" in cls_name or
                            "text"   in cls_name or
                            "caption" in cls_name or
                            "speech" in cls_name or
                            "dialog" in cls_name or
                            "sfx"    in cls_name
                        )
                        # Only fall back "unknown = bubble" for specialist models; generic COCO
                        # models detect people/cars/etc with no class name which should NOT be bubbles.
                        is_bubble = _is_named_bubble or (not cls_name and _is_bubble_specialist)
                        is_panel  = "frame" in cls_name or "panel" in cls_name or "page" in cls_name

                        if is_bubble and bw > 5 and bh > 5:
                            _raw_bubble_boxes.append({
                                "x": bx, "y": by, "w": bw, "h": bh, "conf": conf_score
                            })

                        if is_panel and conf_score >= _panel_conf and bw >= min_w_px and bh >= scaled_min_height_px:
                            _raw_panel_boxes.append({
                                "x": bx, "y": by, "w": bw, "h": bh, "confidence": conf_score
                            })

                        yolo_count += 1

                # ── Cross-tile NMS deduplication ──────────────────────────────────
                # Tiles overlap by 25%, so the same bubble/panel appears in two tile results.
                # Run a simple greedy IoU-based dedup to consolidate duplicates.
                def _nms_boxes(raw: List[Dict], iou_thresh: float = 0.40) -> List[Dict]:
                    if not raw:
                        return []
                    # Sort by confidence descending so we keep the highest-conf detection
                    srt = sorted(raw, key=lambda d: -d.get("conf", d.get("confidence", 0.0)))
                    kept: List[Dict] = []
                    for cand in srt:
                        cx1 = cand["x"];          cy1 = cand["y"]
                        cx2 = cx1 + cand["w"];    cy2 = cy1 + cand["h"]
                        duplicate = False
                        for k in kept:
                            kx1 = k["x"];          ky1 = k["y"]
                            kx2 = kx1 + k["w"];    ky2 = ky1 + k["h"]
                            ix1, iy1 = max(cx1, kx1), max(cy1, ky1)
                            ix2, iy2 = min(cx2, kx2), min(cy2, ky2)
                            inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                            if inter > 0:
                                area_c = max(1, cand["w"] * cand["h"])
                                area_k = max(1, k["w"]    * k["h"])
                                iou = inter / float(area_c + area_k - inter)
                                if iou >= iou_thresh:
                                    duplicate = True
                                    break
                        if not duplicate:
                            kept.append(cand)
                    return kept

                deduped_bubbles = _nms_boxes(_raw_bubble_boxes, iou_thresh=0.40)
                deduped_panels  = _nms_boxes(_raw_panel_boxes,  iou_thresh=0.50)

                # Populate final lists
                for b in deduped_bubbles:
                    ocr_boxes.append({"x": b["x"], "y": b["y"], "w": b["w"], "h": b["h"]})
                for p in deduped_panels:
                    yolo_panel_candidates.append({  # type: ignore
                        "x": p["x"], "y": p["y"], "w": p["w"], "h": p["h"],
                        "confidence": p["confidence"]
                    })

                logger.info(
                    f"[Panel Detection] YOLO: {yolo_count} raw detections → "
                    f"{len(deduped_bubbles)} bubbles + {len(deduped_panels)} panel candidates "
                    f"across {len(tiles)} tiles (specialist_model={_is_bubble_specialist})."
                )
        except Exception as e:
            logger.warning(f"[Panel Detection] Failed to retrieve YOLO bounds for panel detection: {e}")

    # Global Margin Trimming
    crop_x, crop_y, crop_w, crop_h = trim_solid_borders(gray_arr, 0, 0, orig_w, orig_h, bg_mode)

    # color_arr holds the full BGR image (OpenCV) for use in background color detection.
    # It mirrors gray_arr so we always slice them in sync.
    color_arr: Optional[np.ndarray] = img if (has_cv and img is not None) else None

    bg_res = _detect_bg_color_and_threshold(gray_arr, bg_mode, sensitivity, color_arr=color_arr)
    is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb = bg_res
    is_tall_strip = (orig_h / max(1, orig_w) > tall_strip_ratio)

    # For Webtoon mode, do not crop top/bottom global margins so Panel 1 starts at y=0
    if auto_split and is_tall_strip:
        crop_y = 0
        crop_h = orig_h
        gray_arr_processed = gray_arr
        color_arr_processed = color_arr
        w, h = orig_w, orig_h
    elif crop_w > 0 and crop_h > 0 and (crop_w < orig_w or crop_h < orig_h):
        logger.info(f"[Panel Detection] Trimming global solid margins: x={crop_x}, y={crop_y}, w={crop_w}, h={crop_h}")
        gray_arr_processed = gray_arr[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w]
        color_arr_processed = (
            color_arr[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w]
            if color_arr is not None else None
        )
        w, h = crop_w, crop_h
    else:
        gray_arr_processed = gray_arr
        color_arr_processed = color_arr
        w, h = orig_w, orig_h


    if crop_x > 0 or crop_y > 0:
        shifted_ocr_boxes = []
        for box in ocr_boxes:
            shifted_ocr_boxes.append({
                "x": max(0, box["x"] - crop_x),
                "y": max(0, box["y"] - crop_y),
                "w": box["w"],
                "h": box["h"]
            })
        ocr_boxes = shifted_ocr_boxes

    passes = [False, True]
    raw_boxes: List[Dict[str, Any]] = []
    merged_boxes: List[Dict[str, Any]] = []

    for high_sensitivity in passes:
        if auto_split and is_tall_strip:
            webtoon_min_h = scaled_min_height_px
            logger.info(f"[Panel Detection] Running Enhanced Webtoon Slicing strategy (min_height={webtoon_min_h}px, high_sensitivity={high_sensitivity})")
            raw_boxes = _detect_panels_webtoon(
                gray_arr_processed, is_white_bg, threshold_val, webtoon_min_h,
                scaled_min_width_pct, ocr_boxes, median_bg, sensitivity,
                gutter_bg_ratio=gutter_bg_ratio,
                gutter_std_thresh=gutter_std_thresh,
                gutter_flat_bg_ratio=gutter_flat_bg_ratio,
                top_median=top_median,
                bottom_median=bottom_median,
                enable_x_trimming=False,
                high_sensitivity=high_sensitivity
            )
        else:
            logger.info(f"[Panel Detection] Running Grid strategy (high_sensitivity={high_sensitivity})")
            if has_cv:
                raw_boxes = _detect_panels_grid_cv(
                    gray_arr_processed, is_white_bg, threshold_val,
                    canny_low, canny_high, scaled_close_kernel, high_sensitivity,
                    min_panel_area=min_panel_area,
                    max_aspect_ratio=max_aspect_ratio,
                    min_aspect_ratio=min_aspect_ratio,
                )
            else:
                raw_boxes = _detect_panels_grid_pil(
                    gray_arr_processed, is_white_bg, sensitivity, scaled_min_height_px,
                    min_panel_area=min_panel_area,
                    max_aspect_ratio=max_aspect_ratio,
                    min_aspect_ratio=min_aspect_ratio,
                )

        # Fuse YOLO panel candidates with OpenCV raw boxes
        if use_yolo and yolo_panel_candidates:
            for yb in yolo_panel_candidates:
                yx = max(0, yb["x"] - crop_x)
                yy = max(0, yb["y"] - crop_y)
                yw, yh = yb["w"], yb["h"]
                
                matched = False
                for rb in raw_boxes:
                    rx, ry, rw, rh = rb["x"], rb["y"], rb["w"], rb["h"]
                    ix1, iy1 = max(rx, yx), max(ry, yy)
                    ix2, iy2 = min(rx + rw, yx + yw), min(ry + rh, yy + yh)
                    if ix2 > ix1 and iy2 > iy1:
                        inter_area = (ix2 - ix1) * (iy2 - iy1)
                        min_area = min(rw * rh, yw * yh)
                        if min_area > 0 and (inter_area / min_area) > 0.4:
                            matched = True
                            rb["yolo_boosted"] = True
                            break
                if not matched:
                    raw_boxes.append({
                        "x": yx, "y": yy, "w": yw, "h": yh,
                        "yolo_boosted": True
                    })

        min_w = w * scaled_min_width_pct
        effective_merge_thresh = 0 if (auto_split and is_tall_strip) else merge_threshold
        filtered_boxes = _filter_solid_noise(
            raw_boxes, gray_arr_processed, min_w, scaled_min_height_px, auto_split,
            min_panel_area=min_panel_area,
            max_aspect_ratio=max_aspect_ratio,
            min_aspect_ratio=min_aspect_ratio,
            noise_std_thresh=noise_std_thresh,
            flat_row_ratio=flat_row_ratio,
        )
        merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, effective_merge_thresh)

        if bg_mode == "white":
            median_bg = 255.0
        elif bg_mode == "black":
            median_bg = 0.0
        else:
            inset_y = max(1, int(h * 0.02))
            inset_x = max(1, int(w * 0.02))
            edge_samples = np.concatenate([
                gray_arr_processed[inset_y, :],
                gray_arr_processed[-inset_y - 1, :],
                gray_arr_processed[:, inset_x],
                gray_arr_processed[:, -inset_x - 1]
            ])
            median_bg = float(np.median(edge_samples))

        # Skip per-box border trimming in Webtoon mode to preserve 100% contiguous vertical Y slicing without gaps
        if not (auto_split and is_tall_strip):
            trimmed_boxes = []
            for box in merged_boxes:
                bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
                tx, ty, tw, th = trim_solid_borders(gray_arr_processed, bx, by, bw, bh, bg_mode, median_bg)
                if tw >= 15 and th >= 15:
                    trimmed_boxes.append({"x": tx, "y": ty, "w": tw, "h": th})
            merged_boxes = merge_overlapping_boxes(trimmed_boxes, w, h, effective_merge_thresh)

        if len(merged_boxes) > 0:
            has_irregular = False

            # Universal Full-Frame check across all modes
            is_full_frame = (
                len(merged_boxes) == 1 and
                merged_boxes[0]["w"] >= int(w * 0.90) and
                merged_boxes[0]["h"] >= int(h * 0.90)
            )

            # For Grid mode: check full-frame or aspect ratio irregularity to trigger high-sensitivity retry
            if not (auto_split and is_tall_strip):
                if is_full_frame and not high_sensitivity:
                    has_irregular = True
                    logger.info("[Panel Detection] Grid single full-frame detected on Pass 1; retrying with high sensitivity.")
                else:
                    for box in merged_boxes:
                        aspect = float(box["w"]) / float(box["h"]) if box["h"] > 0 else 1.0
                        if aspect > irregular_aspect_high or aspect < irregular_aspect_low:
                            has_irregular = True
                            break
            # For Webtoon mode: check full-frame or under-sliced long strip to trigger high-sensitivity retry
            else:
                is_webtoon_under_sliced = (
                    len(merged_boxes) <= 3 and
                    any(b["h"] >= int(h * 0.40) for b in merged_boxes) and
                    h >= int(w * 3.0)
                )
                if (is_full_frame or is_webtoon_under_sliced) and not high_sensitivity:
                    has_irregular = True
                    logger.info("[Panel Detection] Webtoon strip full-frame or under-sliced on Pass 1; retrying with high sensitivity.")

            if not has_irregular or high_sensitivity:
                break
            else:
                logger.info(f"[Panel Detection] Panels need retry (high_sensitivity={high_sensitivity}); re-running with high sensitivity fallback.")
        else:
            logger.info(f"[Panel Detection] 0 panels detected (high_sensitivity={high_sensitivity}); re-running with high sensitivity fallback.")

    is_full_frame_only = (
        len(merged_boxes) == 0 or
        (len(merged_boxes) == 1 and merged_boxes[0]["w"] >= int(w * 0.95) and merged_boxes[0]["h"] >= int(h * 0.95))
    )

    if is_full_frame_only:
        logger.info(f"[Panel Detection] 0 panels or single full-frame box detected; applying vertical fallback segment slicing (is_tall_strip={is_tall_strip})...")
        merged_boxes = []
        if fallback_segments > 0:
            num_segments = fallback_segments
        elif is_tall_strip:
            num_segments = max(2, round(h / max(1.0, w * 0.9)))
        else:
            num_segments = 2 if h >= w else 3

        seg_h = int(h / num_segments)
        for seg_i in range(num_segments):
            sy = seg_i * seg_h
            sh = int(h - sy) if seg_i == num_segments - 1 else seg_h
            merged_boxes.append({"x": 0, "y": sy, "w": w, "h": sh})

    # Speech Bubble / OCR Box Expansion & Panel Snapping
    # Smartly groups floating speech bubbles directly overlapping a panel into that panel’s bounding box.
    # Strictly caps expansion (max 15px or 8% height) to prevent cascading panel mergers across webtoon gutters.
    if ocr_boxes and len(merged_boxes) > 0:
        expanded_boxes = []
        for box in merged_boxes:
            orig_by1, orig_by2 = box["y"], box["y"] + box["h"]
            max_expand_y = max(15, int(box["h"] * 0.08))  # max 8% height expansion limit

            bx1, by1 = box["x"], box["y"]
            bx2, by2 = box["x"] + box["w"], box["y"] + box["h"]

            for ob in ocr_boxes:
                ox1, oy1 = ob["x"], ob["y"]
                ox2, oy2 = ob["x"] + ob["w"], ob["y"] + ob["h"]

                # Check horizontal overlap
                h_overlap = max(0, min(bx2, ox2) - max(bx1, ox1))
                if h_overlap > 0:
                    v_dist = min(abs(oy2 - orig_by1), abs(orig_by2 - oy1))
                    v_overlap = max(0, min(orig_by2, oy2) - max(orig_by1, oy1))

                    # Only snap if bubble is already overlapping vertically or within 15px
                    if v_overlap > 0 or v_dist <= 15:
                        cand_by1 = max(orig_by1 - max_expand_y, min(by1, oy1))
                        cand_by2 = min(orig_by2 + max_expand_y, max(by2, oy2))
                        bx1 = min(bx1, ox1)
                        by1 = cand_by1
                        bx2 = max(bx2, ox2)
                        by2 = cand_by2

            # Constrain to image dimensions
            bx1 = max(0, bx1)
            by1 = max(0, by1)
            bx2 = min(w, bx2)
            by2 = min(h, by2)

            expanded_boxes.append({
                "x": bx1,
                "y": by1,
                "w": bx2 - bx1,
                "h": by2 - by1
            })
        merged_boxes = expanded_boxes

    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    logger.debug(
        f"[Panel Detection] Pipeline summary: orig_size=({orig_w}x{orig_h}), cropped_size=({w}x{h}), "
        f"raw_boxes={len(raw_boxes)}, filtered_boxes={len(filtered_boxes)}, final_merged={len(merged_boxes)}"
    )
    
    orig_area = max(1, orig_w * orig_h)
    
    for idx, box in enumerate(merged_boxes):
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]

        # Translate from trimmed-image space back to original-image space
        bx += crop_x
        by += crop_y

        if padding_px > 0:
            pad_bx = max(0, bx - padding_px)
            pad_by = max(0, by - padding_px)
            pad_bw = min(orig_w - pad_bx, bw + (padding_px * 2))
            pad_bh = min(orig_h - pad_by, bh + (padding_px * 2))
            bx, by, bw, bh = pad_bx, pad_by, pad_bw, pad_bh

        # Clamp to original image bounds (guards against floating-point/padding overshoot)
        bx = max(0, min(bx, orig_w - 1))
        by = max(0, min(by, orig_h - 1))
        bw = max(1, min(bw, orig_w - bx))
        bh = max(1, min(bh, orig_h - by))

        x, y, w_box, h_box = adjust_to_aspect_ratio(
            bx, by, bw, bh, orig_w, orig_h, aspect_ratio_str
        )

        # Final bounds check — skip (don't crash) if still out of range after clamping
        if x < 0 or y < 0 or w_box <= 0 or h_box <= 0 or (x + w_box) > orig_w or (y + h_box) > orig_h:
            logger.warning(
                f"[Panel Detection] Skipping panel {idx+1}: out-of-bounds after adjust "
                f"(x={x}, y={y}, w={w_box}, h={h_box}, img={orig_w}x{orig_h})"
            )
            continue
        
        # For Webtoon tall strips (free aspect ratio), slice across full content column width
        if is_tall_strip and auto_split and (not aspect_ratio_str or aspect_ratio_str == "free"):
            x = crop_x if (crop_w > 0 and crop_w < orig_w) else 0
            w_box = crop_w if (crop_w > 0 and crop_w < orig_w) else orig_w

        safe_orig_h = max(1, orig_h)
        safe_orig_w = max(1, orig_w)
        crop_top = (y / safe_orig_h) * 100
        crop_bottom = ((safe_orig_h - (y + h_box)) / safe_orig_h) * 100
        crop_left = (x / safe_orig_w) * 100
        crop_right = ((safe_orig_w - (x + w_box)) / safe_orig_w) * 100
        
        area = w_box * h_box
        area_pct = round((area / orig_area) * 100.0, 2)
        aspect = float(w_box) / float(h_box) if h_box > 0 else 1.0
        aspect_ratio_val = round(aspect, 2)

        if aspect >= 2.5:
            aspect_label = "Wide Banner"
        elif aspect >= 1.4:
            aspect_label = "Landscape (16:9)"
        elif aspect >= 1.15:
            aspect_label = "4:3 Standard"
        elif aspect >= 0.85:
            aspect_label = "1:1 Square"
        elif aspect >= 0.6:
            aspect_label = "3:4 Portrait"
        else:
            aspect_label = "Vertical Strip"

        is_header = y < min(250, int(orig_h * 0.02)) and aspect >= 2.5
        if is_header:
            panel_type = "Wide Banner / Header"
        elif area_pct >= 80.0:
            panel_type = "Full Page / Splash"
        elif aspect < 0.5:
            panel_type = "Vertical Strip Panel"
        elif aspect > 2.0:
            panel_type = "Horizontal Panoramic Panel"
        else:
            panel_type = "Standard Storyboard Panel"

        yolo_boosted = box.get("yolo_boosted", False)
        base_conf = 0.95 if (w_box > 40 and h_box > 40 and area_pct > 0.5) else 0.80
        confidence = min(0.99, base_conf + (0.04 if yolo_boosted else 0.0))

        final_panels.append({
            "id": f"panel-{idx + 1}",
            "index": idx + 1,
            "x": x,
            "y": y,
            "width": w_box,
            "height": h_box,
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
            "area": area,
            "areaPct": area_pct,
            "aspectRatio": aspect_ratio_val,
            "aspectRatioLabel": aspect_label,
            "panelType": panel_type,
            "confidence": confidence,
            "isHeader": is_header,
        })
        
    # Sort according to requested reading order (LTR Western vs RTL Manga) using visual 2D row grouping
    sorted_panels = _sort_panels_reading_order(final_panels, reading_order=reading_order)
    
    unique_panels = []
    for panel in sorted_panels:
        if panel.get("confidence", 1.0) < min_confidence:
            continue
            
        is_dup = False
        px1, px2 = panel["x"], panel["x"] + panel["width"]
        py1, py2 = panel["y"], panel["y"] + panel["height"]
        p_area = max(1, panel["height"] * panel["width"])
        
        for existing in unique_panels:
            ex1, ex2 = existing["x"], existing["x"] + existing["width"]
            ey1, ey2 = existing["y"], existing["y"] + existing["height"]
            e_area = max(1, existing["height"] * existing["width"])
            
            # Calculate 2D Intersection Area (X and Y)
            ix1 = max(px1, ex1)
            iy1 = max(py1, ey1)
            ix2 = min(px2, ex2)
            iy2 = min(py2, ey2)
            
            iw = max(0, ix2 - ix1)
            ih = max(0, iy2 - iy1)
            intersection_area = iw * ih
            
            if intersection_area > 0:
                min_area = min(p_area, e_area)
                iou_min = intersection_area / float(min_area)
                
                # Calculate difference across all 4 crop bounds
                dt = abs(panel.get("cropTop", 0.0) - existing.get("cropTop", 0.0))
                db = abs(panel.get("cropBottom", 0.0) - existing.get("cropBottom", 0.0))
                dl = abs(panel.get("cropLeft", 0.0) - existing.get("cropLeft", 0.0))
                dr = abs(panel.get("cropRight", 0.0) - existing.get("cropRight", 0.0))
                
                effective_dedup_thresh = max(dedup_overlap_thresh, 0.88) if (auto_split and is_tall_strip) else dedup_overlap_thresh
                if iou_min > effective_dedup_thresh or (dt < dedup_crop_tolerance and db < dedup_crop_tolerance and dl < dedup_crop_tolerance and dr < dedup_crop_tolerance):
                    is_dup = True
                    break
                
        if not is_dup:
            unique_panels.append(panel)

    logger.info(f"[Panel Detection] Deduplicated to {len(unique_panels)} unique panels.")

    if max_panels > 0 and len(unique_panels) > max_panels:
        unique_panels = unique_panels[:max_panels]

    sanitized_panels = []
    for idx, panel in enumerate(unique_panels):
        sanitized_panels.append({
            "id": f"panel-{idx + 1}",
            "index": int(idx + 1),
            "x": int(panel["x"]),
            "y": int(panel["y"]),
            "width": int(panel["width"]),
            "height": int(panel["height"]),
            "cropTop": float(panel["cropTop"]),
            "cropBottom": float(panel["cropBottom"]),
            "cropLeft": float(panel["cropLeft"]),
            "cropRight": float(panel["cropRight"]),
            "area": int(panel["area"]),
            "areaPct": float(panel["areaPct"]),
            "aspectRatio": float(panel["aspectRatio"]),
            "aspectRatioLabel": str(panel["aspectRatioLabel"]),
            "panelType": str(panel["panelType"]),
            "confidence": float(panel["confidence"]),
            "isHeader": bool(panel["isHeader"]),
        })

    return sanitized_panels


def main():
    parser = argparse.ArgumentParser(description="Local OpenCV/PIL Panel Detector")
    parser.add_argument("--image_path", required=True, help="Path to input image")
    parser.add_argument("--sensitivity", type=float, default=30.0, help="Tolerance sensitivity (0-100)")
    parser.add_argument("--background_mode", default="auto", choices=["auto", "white", "black"], help="Margin background color mode")
    parser.add_argument("--min_width_pct", type=float, default=0.15, help="Minimum width percentage (0.0 - 1.0)")
    parser.add_argument("--min_height_px", type=int, default=60, help="Minimum height in pixels")
    parser.add_argument("--merge_threshold", type=int, default=20, help="Vertical overlap merge threshold in pixels")
    parser.add_argument("--aspect_ratio", default="free", choices=["free", "1:1", "16:9", "9:16", "4:3"], help="Target aspect ratio")
    parser.add_argument("--canny_low", type=int, default=20, help="Canny low threshold")
    parser.add_argument("--canny_high", type=int, default=100, help="Canny high threshold")
    parser.add_argument("--close_kernel_size", type=int, default=15, help="Morphological close kernel size")
    parser.add_argument("--min_panel_area", type=float, default=5000.0, help="Minimum area threshold suitable for comic panels")
    
    parser.add_argument("--auto_split", action="store_true", default=True, help="Automatically split tall strips at gutters")
    parser.add_argument("--no_auto_split", dest="auto_split", action="store_false", help="Disable automatic strip splitting")
    
    parser.add_argument("--enable_clahe", action="store_true", help="Apply CLAHE contrast equalisation before detection")
    parser.add_argument("--bilateral_d", type=int, default=0, help="Bilateral filter diameter (0=disabled)")
    parser.add_argument("--reading_order", default="ltr", choices=["ltr", "rtl"], help="Reading order sorting (ltr or rtl)")
    parser.add_argument("--min_confidence", type=float, default=0.0, help="Minimum confidence threshold (0.0-1.0)")
    parser.add_argument("--max_panels", type=int, default=0, help="Maximum panel cap (0 = unlimited)")

    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(json.dumps({"success": False, "error": f"Image path {args.image_path} does not exist."}))
        sys.exit(1)
        
    try:
        panels = run_cv_detection(
            image_path=args.image_path,
            sensitivity=args.sensitivity,
            bg_mode=args.background_mode,
            min_width_pct=args.min_width_pct,
            min_height_px=args.min_height_px,
            merge_threshold=args.merge_threshold,
            aspect_ratio_str=args.aspect_ratio,
            canny_low=args.canny_low,
            canny_high=args.canny_high,
            close_kernel_size=args.close_kernel_size,
            auto_split=args.auto_split,
            min_panel_area=args.min_panel_area,
            enable_clahe=args.enable_clahe,
            bilateral_d=args.bilateral_d,
            reading_order=args.reading_order,
            min_confidence=args.min_confidence,
            max_panels=args.max_panels
        )
        print(json.dumps({"success": True, "panels": panels, "message": f"Detected {len(panels)} panels."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()