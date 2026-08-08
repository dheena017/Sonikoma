"""
backend/app/services/image/panel_detector/detector.py
─────────────────────────────────────────────────────────────────────────────
Main orchestration detector for panel detection. Exposes run_cv_detection
while delegating webtoon slicing, grid detection, and post-processing
to sub-modules within panel_detector.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import json
import uuid
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


# Import helper sub-modules from panel_detector package & utils
from app.services.image.panel_detection.panel_postprocessor import compute_post_panel_confidence
from app.services.image.utils.panel_box_utils import (
    PanelBounds,
    adjust_to_aspect_ratio,
    merge_overlapping_boxes
)
from app.services.image.panel_detection.webtoon_detector import (
    _detect_bg_color_and_threshold,
    _detect_panels_webtoon
)
from app.services.image.panel_detection.grid_detector import (
    _detect_panels_grid_cv,
    _detect_panels_grid_pil
)
from app.services.image.utils.panel_image_utils import (
    trim_solid_borders,
    _filter_solid_noise
)

logger = logging.getLogger("sonikoma.services.image.panel_detection.panel_detector")


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
            row_avg_h = sum(p.get("h", p.get("height", 0)) for p in row) / float(len(row))
            
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


def _oversized_panel_height_limit(image_h: int, median_panel_h: Optional[float] = None) -> int:
    if median_panel_h is not None and median_panel_h > 50:
        dynamic_limit = max(int(median_panel_h * 2.5), 1000)
        return min(dynamic_limit, 2200)
    return max(1200, min(2200, int(image_h * 0.70)))


def _is_oversized_panel(box: Dict[str, Any], image_h: int, median_panel_h: Optional[float] = None) -> bool:
    limit = _oversized_panel_height_limit(image_h, median_panel_h=median_panel_h)
    return int(box.get("h", 0)) > limit


def _shift_ocr_boxes_into_panel(
    ocr_boxes: List[Dict[str, Any]],
    panel_box: Dict[str, Any]
) -> List[Dict[str, int]]:
    px1 = int(panel_box["x"])
    py1 = int(panel_box["y"])
    px2 = px1 + int(panel_box["w"])
    py2 = py1 + int(panel_box["h"])
    shifted: List[Dict[str, int]] = []

    for box in ocr_boxes:
        bx1 = int(box.get("x", 0))
        by1 = int(box.get("y", 0))
        bx2 = bx1 + int(box.get("w", 0))
        by2 = by1 + int(box.get("h", 0))
        ix1 = max(px1, bx1)
        iy1 = max(py1, by1)
        ix2 = min(px2, bx2)
        iy2 = min(py2, by2)
        if ix2 > ix1 and iy2 > iy1:
            shifted.append({
                "x": ix1 - px1,
                "y": iy1 - py1,
                "w": ix2 - ix1,
                "h": iy2 - iy1,
            })

    return shifted


def _subdivide_continuous_tall_art_panel(
    sub_gray: np.ndarray,
    bx: int,
    by: int,
    bw: int,
    bh: int,
    child_ocr: List[Dict[str, Any]],
    target_card_h: int = 650
) -> List[Dict[str, int]]:
    """
    Scans continuous artwork scenes for natural visual scene transitions, horizontal panel
    border lines, background luminance shifts, or low-feature inter-text gaps.
    Avoids hardcoded mathematical grid cuts and strictly protects speech bubbles and character artwork.
    """
    min_split_h = max(900, int(bw * 1.6))
    if bh <= min_split_h:
        return [{"x": 0, "y": 0, "w": bw, "h": bh}]

    h, w = sub_gray.shape

    # 1. Compute row-by-row image signals
    # a) Horizontal Sobel gradient (detects horizontal border/rule lines)
    if HAS_CV and cv2 is not None:
        sobel_y = cv2.Sobel(sub_gray, cv2.CV_64F, 0, 1, ksize=3)
        row_border_strength = np.mean(np.abs(sobel_y), axis=1)
    else:
        row_border_strength = np.mean(np.abs(np.diff(sub_gray.astype(float), axis=0)), axis=1)
        row_border_strength = np.append(row_border_strength, 0.0)

    # b) Row std-dev and stroke density
    row_stds = np.std(sub_gray, axis=1) if sub_gray.size > 0 else np.zeros(h)
    row_diff_x = np.abs(np.diff(sub_gray.astype(float), axis=1)) if w > 1 else np.zeros((h, 1))
    row_stroke_density = np.mean(row_diff_x > 15.0, axis=1) if row_diff_x.size > 0 else np.zeros(h)

    # c) Background luminance baseline shift (scene transition detection)
    row_medians = np.median(sub_gray, axis=1) if sub_gray.size > 0 else np.zeros(h)
    win_h = min(40, max(10, h // 12))
    lum_shift = np.zeros(h)
    for y_idx in range(win_h, h - win_h):
        top_m = np.mean(row_medians[y_idx - win_h:y_idx])
        bot_m = np.mean(row_medians[y_idx:y_idx + win_h])
        lum_shift[y_idx] = abs(top_m - bot_m)

    # 2. Build Forbidden Cut Zone Mask (Speech bubbles, OCR text boxes, outer edges)
    forbidden_mask = np.zeros(h, dtype=bool)
    min_edge_margin = max(100, int(bw * 0.35))
    forbidden_mask[:min_edge_margin] = True
    forbidden_mask[-min_edge_margin:] = True

    if child_ocr:
        for b in child_ocr:
            by1 = max(0, int(b.get("y", 0)) - 20)
            by2 = min(h, int(b.get("y", 0)) + int(b.get("h", 0)) + 20)
            if by2 > by1:
                forbidden_mask[by1:by2] = True

    # 3. Score all candidate rows for natural cut quality
    max_border = np.max(row_border_strength) + 1e-5
    max_lum = np.max(lum_shift) + 1e-5
    max_std = np.max(row_stds) + 1e-5

    norm_border = row_border_strength / max_border
    norm_lum = lum_shift / max_lum
    norm_std = row_stds / max_std

    # Composite cut score: low feature std, high border, high luminance transition
    cut_quality = (0.5 * norm_std) - (0.35 * norm_border) - (0.30 * norm_lum)

    # 4. Scan for natural cut locations across height
    min_subpanel_h = max(350, int(bw * 0.75))
    cut_y_list = [0]

    curr_y = 0
    while curr_y + min_subpanel_h < h - min_edge_margin:
        search_start = curr_y + min_subpanel_h
        search_end = min(h - min_edge_margin, curr_y + int(bw * 2.2))

        if search_end <= search_start:
            break

        valid_rows = [y for y in range(search_start, search_end) if not forbidden_mask[y]]

        if not valid_rows:
            search_end_exp = min(h - 60, search_end + 150)
            valid_rows = [y for y in range(search_start, search_end_exp) if not forbidden_mask[y]]

        if not valid_rows:
            curr_y += min_subpanel_h
            continue

        best_y = min(valid_rows, key=lambda y: cut_quality[y])

        # Evaluate if best_y is a genuine scene break or border line
        has_border = row_border_strength[best_y] > (0.45 * max_border) and row_border_strength[best_y] > 8.0
        has_lum_shift = lum_shift[best_y] > (0.40 * max_lum) and lum_shift[best_y] > 18.0
        has_flat_gap = row_stds[best_y] < 10.0 and row_stroke_density[best_y] < 0.05

        # If it is a real visual boundary or if panel remains super tall (> 2500px)
        if has_border or has_lum_shift or has_flat_gap or (h - curr_y > 2500):
            cut_y_list.append(best_y)
            curr_y = best_y
        else:
            # Skip cutting; preserve continuous scene
            curr_y += min_subpanel_h

    cut_y_list.append(h)

    # Clean up cuts
    final_cuts = [0]
    for cy in cut_y_list[1:]:
        if cy - final_cuts[-1] >= min_subpanel_h:
            final_cuts.append(cy)
        else:
            if cy == h and len(final_cuts) > 1:
                final_cuts[-1] = h

    if final_cuts[-1] < h:
        if h - final_cuts[-1] < min_subpanel_h and len(final_cuts) > 1:
            final_cuts[-1] = h
        else:
            final_cuts.append(h)

    subdivided_boxes = []
    for k in range(len(final_cuts) - 1):
        sy1 = final_cuts[k]
        sy2 = final_cuts[k + 1]
        sh = sy2 - sy1
        if sh >= 120:
            slice_gray = sub_gray[sy1:sy2, :]
            col_stds = np.std(slice_gray, axis=0) if slice_gray.size > 0 else np.zeros(bw)
            content_cols = col_stds > 2.5
            if np.any(content_cols):
                valid_cols = np.where(content_cols)[0]
                left_pad = max(0, valid_cols[0] - 4)
                right_pad = min(bw, valid_cols[-1] + 5)

                if child_ocr:
                    for b in child_ocr:
                        by1 = int(b.get("y", 0))
                        by2 = by1 + int(b.get("h", 0))
                        if max(sy1, by1) < min(sy2, by2):
                            bx1 = max(0, int(b.get("x", 0)))
                            bx2 = min(bw, bx1 + int(b.get("w", 0)))
                            left_pad = min(left_pad, bx1)
                            right_pad = max(right_pad, bx2)

                final_x = left_pad
                final_w = max(10, right_pad - left_pad)
            else:
                final_x = 0
                final_w = bw

            subdivided_boxes.append({
                "x": final_x,
                "y": sy1,
                "w": final_w,
                "h": sh
            })

    return subdivided_boxes if subdivided_boxes else [{"x": 0, "y": 0, "w": bw, "h": bh}]


def _split_oversized_webtoon_boxes(
    boxes: List[Dict[str, Any]],
    gray_arr: np.ndarray,
    image_w: int,
    image_h: int,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: List[Dict[str, Any]],
    median_bg: Optional[float],
    sensitivity: float,
    gutter_bg_ratio: float,
    gutter_std_thresh: float,
    gutter_flat_bg_ratio: float,
    top_median: Optional[float],
    bottom_median: Optional[float],
    padding_px: int,
    min_panel_area: float,
    max_aspect_ratio: float,
    min_aspect_ratio: float,
    noise_std_thresh: float,
    flat_row_ratio: float,
    depth: int = 0,
    max_depth: int = 3,
) -> List[Dict[str, Any]]:
    if depth >= max_depth or not boxes:
        return boxes

    split_boxes: List[Dict[str, Any]] = []
    panel_heights = [int(b.get("h", 0)) for b in boxes if int(b.get("h", 0)) > 0]
    median_panel_h = float(np.median(panel_heights)) if panel_heights else None
    oversized_limit = _oversized_panel_height_limit(image_h, median_panel_h=median_panel_h)

    for box_idx, box in enumerate(sorted(boxes, key=lambda b: (b.get("y", 0), b.get("x", 0))), start=1):
        if not _is_oversized_panel(box, image_h, median_panel_h=median_panel_h):
            split_boxes.append(box)
            continue

        bx = max(0, min(image_w - 1, int(box["x"])))
        by = max(0, min(image_h - 1, int(box["y"])))
        bw = max(1, min(image_w - bx, int(box["w"])))
        bh = max(1, min(image_h - by, int(box["h"])))
        sub_gray = gray_arr[by:by + bh, bx:bx + bw]

        if sub_gray.size == 0 or bh < min_height_px * 2:
            split_boxes.append(box)
            continue

        child_ocr = _shift_ocr_boxes_into_panel(ocr_boxes, {"x": bx, "y": by, "w": bw, "h": bh})
        logger.debug(
            f"[Panel Recursive Split] depth={depth + 1}: splitting oversized panel #{box_idx} "
            f"at y={by}, h={bh}px (limit={oversized_limit}px)"
        )

        detection_result = _detect_panels_webtoon(
            sub_gray,
            is_white_bg,
            threshold_val,
            min_height_px,
            min_width_pct,
            child_ocr,
            median_bg,
            sensitivity,
            gutter_bg_ratio=gutter_bg_ratio,
            gutter_std_thresh=gutter_std_thresh,
            gutter_flat_bg_ratio=gutter_flat_bg_ratio,
            top_median=top_median,
            bottom_median=bottom_median,
            high_sensitivity=True,
            padding_px=padding_px,
        )

        raw_children = detection_result.panels
        min_w = bw * min_width_pct
        filtered_children = _filter_solid_noise(
            raw_children,
            sub_gray,
            min_w,
            min_height_px,
            True,
            min_panel_area=min_panel_area,
            max_aspect_ratio=max_aspect_ratio,
            min_aspect_ratio=min_aspect_ratio,
            noise_std_thresh=noise_std_thresh,
            flat_row_ratio=flat_row_ratio,
        )
        merged_children = merge_overlapping_boxes(
            filtered_children,
            bw,
            bh,
            0,
            separator_bands=detection_result.separator_bands,
            gutter_ranges=detection_result.gutter_ranges,
        )

        if len(merged_children) <= 1:
            logger.debug(
                f"[Panel Recursive Split] depth={depth + 1}: initial sub-detection produced {len(merged_children)} child panel(s); "
                f"triggering fallback cascade for oversized panel at y={by}, h={bh}px."
            )
            # Cascading Fallback 1: Relaxed Threshold Sub-Detection
            retry_res = _detect_panels_webtoon(
                sub_gray, is_white_bg, threshold_val,
                max(20, min_height_px // 2), min_width_pct, child_ocr,
                median_bg, sensitivity,
                gutter_bg_ratio=gutter_bg_ratio * 0.75,
                gutter_std_thresh=gutter_std_thresh + 6.0,
                gutter_flat_bg_ratio=gutter_flat_bg_ratio * 0.70,
                top_median=top_median, bottom_median=bottom_median,
                high_sensitivity=True, padding_px=padding_px
            )
            retry_filtered = _filter_solid_noise(
                retry_res.panels, sub_gray, bw * min_width_pct, max(20, min_height_px // 2), True,
                min_panel_area=min_panel_area * 0.5, max_aspect_ratio=max_aspect_ratio,
                min_aspect_ratio=min_aspect_ratio, noise_std_thresh=noise_std_thresh, flat_row_ratio=flat_row_ratio
            )
            merged_children = merge_overlapping_boxes(
                retry_filtered, bw, bh, 0,
                separator_bands=retry_res.separator_bands, gutter_ranges=retry_res.gutter_ranges
            )

        # Cascading Fallback 2: Intelligent Continuous Tall Art Subdivision
        if len(merged_children) <= 1 and bh > max(900, int(bw * 1.6)):
            logger.debug(f"[Panel Recursive Split] depth={depth + 1}: continuous tall art subdivision for panel at y={by}, h={bh}px")
            merged_children = _subdivide_continuous_tall_art_panel(
                sub_gray, bx, by, bw, bh, child_ocr
            )

        if len(merged_children) <= 1:
            split_boxes.append(box)
            continue

        child_boxes: List[Dict[str, Any]] = []
        for child_idx, child in enumerate(merged_children, start=1):
            shifted_child = dict(child)
            shifted_child["x"] = bx + int(child["x"])
            shifted_child["y"] = by + int(child["y"])
            shifted_child["w"] = int(child["w"])
            shifted_child["h"] = int(child["h"])
            shifted_child["parent_panel"] = box.get("candidate_id", box.get("id", box_idx))
            shifted_child["depth"] = depth + 1
            shifted_child["lineage"] = box.get("lineage", [box_idx]) + [f"split-{depth + 1}-{child_idx}"]
            child_boxes.append(shifted_child)

        logger.debug(
            f"[Panel Recursive Split] depth={depth + 1}: replaced oversized panel at y={by}, h={bh}px "
            f"with {len(child_boxes)} child panels."
        )
        split_boxes.extend(
            _split_oversized_webtoon_boxes(
                child_boxes,
                gray_arr,
                image_w,
                image_h,
                is_white_bg,
                threshold_val,
                min_height_px,
                min_width_pct,
                ocr_boxes,
                median_bg,
                sensitivity,
                gutter_bg_ratio,
                gutter_std_thresh,
                gutter_flat_bg_ratio,
                top_median,
                bottom_median,
                padding_px,
                min_panel_area,
                max_aspect_ratio,
                min_aspect_ratio,
                noise_std_thresh,
                flat_row_ratio,
                depth=depth + 1,
                max_depth=max_depth,
            )
        )

    return sorted(split_boxes, key=lambda b: (b.get("y", 0), b.get("x", 0)))


def detect_panels_in_image(
    # ── Parameters ────────────────────────────────────────────────────────────
    image_path: str,
    sensitivity: float = 0.5,
    bg_mode: str = "auto",
    min_width_pct: float = 5.0,
    min_height_px: int = 60,
    merge_threshold: int = 10,
    aspect_ratio_str: str = "any",
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
    gutter_bg_ratio: float = 0.90,          # min background fraction for a gutter row
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
    job_id: Optional[str] = None
) -> List[Dict[str, Any]]:

    """
    Main orchestration function for human-readable panel detection. Loads the image, runs background
    detection, routes to the appropriate detection strategy (Vertical Strip Slicing vs. Grid Contours),
    performs YOLO deep learning box fusion, noise filtering, overlap merging, padding, and scaling.
    """
    job_id = job_id or f"job_{uuid.uuid4().hex[:8]}"
    logger.info(f"[{job_id}] Starting local panel detection on {image_path} (use_yolo={use_yolo})")
    
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

    _OCR_MAX_PIXELS = 4_000_000
    ocr_boxes: List[Dict[str, int]] = []
    yolo_panel_candidates: List[Dict[str, Union[int, float]]] = []

    _run_ocr_for_protection = (
        not use_yolo and
        (orig_w * orig_h) <= _OCR_MAX_PIXELS
    )

    if _run_ocr_for_protection:
        try:
            import asyncio
            from app.services.image.ocr.ocr_engine import extract_full_ocr_data
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
            from app.services.image.panel_detection.speech_bubble_detector import get_yolo_speech_bubble_model
            yolo_model = get_yolo_speech_bubble_model()
            if yolo_model is not None:
                is_tall_strip_image = orig_h > 2000 and (float(orig_h) / float(max(1, orig_w)) > 1.5)

                _model_names = getattr(yolo_model, "names", {}) or {}
                _num_classes = len(_model_names)
                _is_bubble_specialist = _num_classes <= 5
                logger.info(f"[{job_id}] YOLO model loaded: names={_model_names}, num_classes={_num_classes}, is_bubble_specialist={_is_bubble_specialist}")

                tiles: List[Tuple[int, int]] = []
                if is_tall_strip_image:
                    tile_h = min(2000, max(1200, int(orig_w * 2.5)))
                    overlap = max(250, tile_h // 4)
                    step = tile_h - overlap
                    for y_start in range(0, orig_h, step):
                        y_end = min(orig_h, y_start + tile_h)
                        tiles.append((y_start, y_end))
                        if y_end >= orig_h:
                            break
                else:
                    tiles.append((0, orig_h))

                _pil_full = None
                if is_tall_strip_image and not (has_cv and img is not None):
                    try:
                        _pil_full = Image.open(image_path)
                    except Exception:
                        pass

                _bubble_conf = max(0.10, yolo_conf - 0.05)
                _panel_conf  = max(yolo_conf, 0.25)

                yolo_count = 0
                min_w_px = int(orig_w * scaled_min_width_pct)

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
                            conf=_bubble_conf,
                            iou=0.45,
                            verbose=False,
                            agnostic_nms=True,
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

                        by1 += y_start
                        by2 += y_start
                        bx, by, bw, bh = int(bx1), int(by1), int(bx2 - bx1), int(by2 - by1)

                        cls_id = int(box_instance.cls[0].cpu().numpy()) if hasattr(box_instance, "cls") and box_instance.cls is not None else 0
                        cls_name = _model_names.get(cls_id, "").lower() if _model_names else ""

                        _is_named_bubble = (
                            "bubble" in cls_name or
                            "balloon" in cls_name or
                            "text"   in cls_name or
                            "caption" in cls_name or
                            "speech" in cls_name or
                            "dialog" in cls_name or
                            "sfx"    in cls_name
                        )
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

                def _nms_boxes(raw: List[Dict], iou_thresh: float = 0.40) -> List[Dict]:
                    if not raw:
                        return []
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

    color_arr: Optional[np.ndarray] = img if (has_cv and img is not None) else None

    bg_res = _detect_bg_color_and_threshold(gray_arr, bg_mode, sensitivity, color_arr=color_arr)
    is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb = bg_res
    is_tall_strip = (orig_h / max(1, orig_w) > tall_strip_ratio)

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

    if ocr_boxes and (crop_x > 0 or crop_y > 0):
        logger.info(f"[{job_id}] Normalizing {len(ocr_boxes)} OCR/YOLO boxes for crop offset (crop_x={crop_x}, crop_y={crop_y})")
        shifted_ocr_boxes = []
        for b_idx, box in enumerate(ocr_boxes):
            norm_x = max(0, box["x"] - crop_x)
            norm_y = max(0, box["y"] - crop_y)
            norm_box = {"x": norm_x, "y": norm_y, "w": box["w"], "h": box["h"]}
            if not (0 <= norm_box["x"] <= w):
                logger.warning(
                    f"[{job_id}] OCR box #{b_idx+1} X ({norm_box['x']}) out of trimmed width bounds ({w}); clamping."
                )
                norm_box["x"] = max(0, min(w, norm_box["x"]))
            if not (0 <= norm_box["y"] <= h):
                logger.warning(
                    f"[{job_id}] OCR box #{b_idx+1} Y ({norm_box['y']}) out of trimmed height bounds ({h}); clamping."
                )
                norm_box["y"] = max(0, min(h, norm_box["y"]))
            shifted_ocr_boxes.append(norm_box)
        logger.info(f"[{job_id}] OCR normalization complete: {len(shifted_ocr_boxes)} boxes validated inside ({w}x{h})")
        ocr_boxes = shifted_ocr_boxes

    passes = [False, True]
    raw_boxes: List[Dict[str, Any]] = []
    filtered_boxes: List[Dict[str, Any]] = []
    merged_boxes: List[Dict[str, Any]] = []

    for high_sensitivity in passes:
        sep_cut_points = []
        gut_ranges_list = []
        if auto_split and is_tall_strip:
            webtoon_min_h = scaled_min_height_px
            logger.info(f"[{job_id}] Running Enhanced Webtoon Slicing strategy (min_height={webtoon_min_h}px, high_sensitivity={high_sensitivity})")
            webtoon_result = _detect_panels_webtoon(
                gray_arr_processed, is_white_bg, threshold_val, webtoon_min_h,
                scaled_min_width_pct, ocr_boxes, median_bg, sensitivity,
                gutter_bg_ratio=gutter_bg_ratio,
                gutter_std_thresh=gutter_std_thresh,
                gutter_flat_bg_ratio=gutter_flat_bg_ratio,
                top_median=top_median,
                bottom_median=bottom_median,
                high_sensitivity=high_sensitivity,
                padding_px=padding_px
            )
            raw_boxes = webtoon_result.panels
            sep_cut_points = webtoon_result.separator_bands
            gut_ranges_list = webtoon_result.gutter_ranges
        else:
            logger.info(f"[{job_id}] Running Grid strategy (high_sensitivity={high_sensitivity})")
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

        if use_yolo and yolo_panel_candidates:
            for yb in yolo_panel_candidates:
                yx1 = max(0, int(yb["x"]) - crop_x)
                yy1 = max(0, int(yb["y"]) - crop_y)
                yx2 = min(w, int(yb["x"]) + int(yb["w"]) - crop_x)
                yy2 = min(h, int(yb["y"]) + int(yb["h"]) - crop_y)

                if yx2 <= yx1 or yy2 <= yy1:
                    continue

                yx, yy = yx1, yy1
                yw, yh = yx2 - yx1, yy2 - yy1
                
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

        merged_boxes = merge_overlapping_boxes(
            filtered_boxes, w, h, effective_merge_thresh,
            separator_bands=sep_cut_points,
            gutter_ranges=gut_ranges_list
        )

        pre_split_count = len(merged_boxes)
        if auto_split and merged_boxes:
            merged_boxes = _split_oversized_webtoon_boxes(
                merged_boxes,
                gray_arr_processed,
                w,
                h,
                is_white_bg,
                threshold_val,
                scaled_min_height_px,
                scaled_min_width_pct,
                ocr_boxes,
                median_bg,
                sensitivity,
                gutter_bg_ratio,
                gutter_std_thresh,
                gutter_flat_bg_ratio,
                top_median,
                bottom_median,
                padding_px,
                min_panel_area,
                max_aspect_ratio,
                min_aspect_ratio,
                noise_std_thresh,
                flat_row_ratio,
            )
            if len(merged_boxes) != pre_split_count:
                logger.info(
                    f"[{job_id}] Oversized recursive split adjusted merged panels: "
                    f"{pre_split_count} -> {len(merged_boxes)}"
                )

        from app.services.image.panel_detection.panel_postprocessor import (
            resolve_micro_panels,
            resolve_overlapping_panels_lineage,
            recover_coverage_selectively
        )
        merged_boxes = resolve_micro_panels(merged_boxes, gray_arr_processed, h)
        merged_boxes = resolve_overlapping_panels_lineage(merged_boxes)
        merged_coords = {(b.get("x", 0), b.get("y", 0), b.get("w", 0), b.get("h", 0)) for b in merged_boxes}
        discarded = [b for b in raw_boxes if (b.get("x", 0), b.get("y", 0), b.get("w", 0), b.get("h", 0)) not in merged_coords]
        merged_boxes = recover_coverage_selectively(merged_boxes, discarded, gray_arr_processed, h, target_coverage=0.92)

        logger.info(
            f"[{job_id}] STAGE COUNTERS: Separators detected={len(sep_cut_points)} | "
            f"Raw candidates={len(raw_boxes)} | Filtered boxes={len(filtered_boxes)} | "
            f"Merged before split={pre_split_count} | Final after split={len(merged_boxes)}"
        )

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

            is_full_frame = (
                len(merged_boxes) == 1 and
                merged_boxes[0]["w"] >= int(w * 0.90) and
                merged_boxes[0]["h"] >= int(h * 0.90)
            )

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
                logger.info(f"[{job_id}] Panels need retry (high_sensitivity={high_sensitivity}); re-running with high sensitivity fallback.")
        else:
            logger.info(f"[{job_id}] 0 panels detected (high_sensitivity={high_sensitivity}); re-running with high sensitivity fallback.")

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

    if ocr_boxes and len(merged_boxes) > 0:
        expanded_boxes = []
        for box in merged_boxes:
            orig_by1, orig_by2 = box["y"], box["y"] + box["h"]
            # max_expand_y: dynamic scale by panel height fraction, capped at ocr_snap_distance_px
            max_expand_y = max(8, min(ocr_snap_distance_px, int(box["h"] * ocr_snap_pct)))

            bx1, by1 = box["x"], box["y"]
            bx2, by2 = box["x"] + box["w"], box["y"] + box["h"]

            for ob in ocr_boxes:
                ox1, oy1 = ob["x"], ob["y"]
                ox2, oy2 = ob["x"] + ob["w"], ob["y"] + ob["h"]

                h_overlap = max(0, min(bx2, ox2) - max(bx1, ox1))
                if h_overlap > 0:
                    v_dist = min(abs(oy2 - orig_by1), abs(orig_by2 - oy1))
                    v_overlap = max(0, min(orig_by2, oy2) - max(orig_by1, oy1))

                    if v_overlap > 0 or v_dist <= ocr_snap_distance_px:
                        cand_by1 = max(orig_by1 - max_expand_y, min(by1, oy1))
                        cand_by2 = min(orig_by2 + max_expand_y, max(by2, oy2))
                        bx1 = min(bx1, ox1)
                        by1 = cand_by1
                        bx2 = max(bx2, ox2)
                        by2 = cand_by2

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

        bx += crop_x
        by += crop_y

        if padding_px > 0:
            px1 = max(0, bx - padding_px)
            py1 = max(0, by - padding_px)
            px2 = min(orig_w, bx + bw + padding_px)
            py2 = min(orig_h, by + bh + padding_px)
            bx, by, bw, bh = px1, py1, max(1, px2 - px1), max(1, py2 - py1)

        bx = max(0, min(bx, orig_w - 1))
        by = max(0, min(by, orig_h - 1))
        bw = max(1, min(bw, orig_w - bx))
        bh = max(1, min(bh, orig_h - by))

        x, y, w_box, h_box = adjust_to_aspect_ratio(
            bx, by, bw, bh, orig_w, orig_h, aspect_ratio_str
        )

        if x < 0 or y < 0 or w_box <= 0 or h_box <= 0 or (x + w_box) > orig_w or (y + h_box) > orig_h:
            logger.warning(
                f"[Panel Detection] Skipping panel {idx+1}: out-of-bounds after adjust "
                f"(x={x}, y={y}, w={w_box}, h={h_box}, img={orig_w}x{orig_h})"
            )
            continue
        
        bounds = PanelBounds.from_pixels(x, y, w_box, h_box, space="merged_canvas")

        if is_tall_strip and auto_split and (not aspect_ratio_str or aspect_ratio_str == "free"):
            col_min_x = crop_x if (crop_w > 0 and crop_w < orig_w) else 0
            col_max_x = (crop_x + crop_w) if (crop_w > 0 and crop_w < orig_w) else orig_w
            x1 = max(bounds.x, col_min_x)
            x2 = min(bounds.x2, col_max_x)
            if x2 <= x1:
                x1, x2 = col_min_x, col_max_x
            bounds = PanelBounds.from_pixels(x1, bounds.y, max(1, x2 - x1), bounds.height, space="merged_canvas")

        bounds = bounds.clamp(orig_w, orig_h)
        x, y, w_box, h_box = bounds.x, bounds.y, bounds.width, bounds.height
        insets = bounds.to_inset_percentages(orig_w, orig_h)
        crop_top, crop_bottom, crop_left, crop_right = insets["cropTop"], insets["cropBottom"], insets["cropLeft"], insets["cropRight"]
        
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
        base_conf = compute_post_panel_confidence(box, gray_arr_processed)
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

    debug_exported = False
    try:
        from app.services.image.panel_detection.debug_visualizer import export_multi_stage_debug_images
        debug_pb_list = [
            PanelBounds.from_pixels(p["x"], p["y"], p["width"], p["height"], space="merged_canvas")
            for p in sanitized_panels
        ]
        export_src = img if (has_cv and img is not None) else image_path
        export_multi_stage_debug_images(export_src, debug_pb_list, job_id=job_id)
        debug_exported = True
    except Exception as viz_err:
        logger.warning(f"[{job_id}] Debug visualizer export skipped: {viz_err}")

    # Structured End-of-Run Pipeline Summary
    total_covered_h = sum(p["height"] for p in sanitized_panels)
    total_gap_h = max(0, orig_h - total_covered_h)
    avg_trim = int(sum(p.get("top_removed_px", 0) + p.get("bottom_removed_px", 0) for p in sanitized_panels) / max(1, len(sanitized_panels)))
    max_trim = max([p.get("top_removed_px", 0) for p in sanitized_panels] + [0])

    summary_block = f"""
================================================================================
PIPELINE SUMMARY [{job_id}]
================================================================================
Job ID:         {job_id}
Image Size:     {orig_w} x {orig_h} px
Detector Mode:  {"Webtoon Slicing" if (auto_split and is_tall_strip) else "Grid Contours"}
Raw Candidates: {len(raw_boxes)}
Filter Boxes:   {len(filtered_boxes)}
Final Merged:   {len(sanitized_panels)}
Coverage:       {total_covered_h} px / {orig_h} px ({round((total_covered_h / max(1, orig_h)) * 100, 1)}%)
Gap Uncovered:  {total_gap_h} px
Average Trim:   {avg_trim} px
Largest Trim:   {max_trim} px
YOLO Panels:    {len(yolo_panel_candidates)}
YOLO Bubbles:   {len(ocr_boxes)}
Crop Cache:     {len(sanitized_panels)} generated
Debug Export:   {"Exported" if debug_exported else "Skipped"}
================================================================================
"""
    logger.info(summary_block)

    try:
        import json
        import time
        detector_ver = os.getenv("DETECTOR_VERSION", "v1.0.0-stabilized")
        summary_data = {
            "job_id": job_id,
            "detector_version": detector_ver,
            "image_size": f"{orig_w}x{orig_h}",
            "detector_mode": "webtoon" if (auto_split and is_tall_strip) else "grid",
            "panel_count": len(sanitized_panels),
            "coverage": round(total_covered_h / max(1, orig_h), 4),
            "gap_area": round(total_gap_h / max(1, orig_h), 4),
            "avg_trim_px": avg_trim,
            "largest_trim_px": max_trim,
            "raw_candidates": len(raw_boxes),
            "filtered_boxes": len(filtered_boxes),
            "yolo_bubbles": len(ocr_boxes)
        }
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        summary_dir = os.path.join(project_root, "data", "logs")
        os.makedirs(summary_dir, exist_ok=True)
        summary_path = os.path.join(summary_dir, f"pipeline_summary_{job_id}.json")
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2)
    except Exception as summary_err:
        logger.debug(f"[{job_id}] JSON summary export skipped: {summary_err}")

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


# Backward-compatibility alias
run_cv_detection = detect_panels_in_image

if __name__ == "__main__":
    main()

