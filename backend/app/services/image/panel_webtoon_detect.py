"""
backend/app/services/image/panel_webtoon_detect.py
─────────────────────────────────────────────────────────────────────────────
High-precision Webtoon vertical strip slicing algorithms, adaptive multi-channel
background detection, gradient baseline tracking, and column subdivision.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Optional, Any, Union

from services.image.utils.panel_box_utils import protect_slice_x, protect_slice_y

logger = logging.getLogger("sonikoma.services.image.panel_webtoon_detect")


def _detect_bg_color_and_threshold(
    gray_arr: np.ndarray,
    bg_mode: str = "auto",
    sensitivity: float = 30.0,
    color_arr: Optional[np.ndarray] = None
) -> Tuple[bool, int, float, float, float, float, Tuple[int, int, int]]:
    """
    Detects background parameters across grayscale and optional color channels.
    Calculates adaptive (is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb).
    Supports gradient baselines across tall strips and multi-channel color matching.
    """
    h, w = gray_arr.shape
    band_y = max(1, min(20, int(h * 0.005)))
    band_x = max(1, min(20, int(w * 0.01)))

    top_edge = gray_arr[:band_y, :]
    bottom_edge = gray_arr[-band_y:, :]
    left_edge = gray_arr[:, :band_x]
    right_edge = gray_arr[:, -band_x:]

    top_median = float(np.median(top_edge))
    bottom_median = float(np.median(bottom_edge))

    edge_samples = np.concatenate([top_edge.ravel(), bottom_edge.ravel(), left_edge.ravel(), right_edge.ravel()])
    median_bg = float(np.median(edge_samples))
    bg_std = float(np.std(edge_samples))

    if bg_mode == "auto":
        is_white_bg = (median_bg > 127.0)
    else:
        is_white_bg = bg_mode == "white"
        median_bg = 255.0 if is_white_bg else 0.0

    # Dynamic threshold adaptation based on noise variance (bg_std) and sensitivity
    noise_adaptive_offset = max(10.0, min(35.0, (sensitivity * 1.5) + (bg_std * 0.5)))
    if is_white_bg:
        threshold_val = int(min(252, max(140, median_bg - noise_adaptive_offset)))
    else:
        threshold_val = int(max(8, min(115, median_bg + noise_adaptive_offset)))

    bg_color_rgb = (255, 255, 255) if is_white_bg else (0, 0, 0)
    if color_arr is not None and color_arr.ndim == 3 and color_arr.shape[2] >= 3:
        try:
            top_c = color_arr[inset_y, :, :3]
            bot_c = color_arr[-inset_y - 1, :, :3]
            left_c = color_arr[:, inset_x, :3]
            right_c = color_arr[:, -inset_x - 1, :3]
            all_c = np.concatenate([top_c, bot_c, left_c, right_c], axis=0)
            med_c = np.median(all_c, axis=0)
            bg_color_rgb = (int(med_c[0]), int(med_c[1]), int(med_c[2]))
        except Exception:
            pass

    logger.debug(
        f"[Panel Webtoon Detect] BG Detection: is_white_bg={is_white_bg}, "
        f"threshold_val={threshold_val}, median_bg={median_bg:.1f}, bg_std={bg_std:.1f}, "
        f"top_median={top_median:.1f}, bottom_median={bottom_median:.1f}, bg_color_rgb={bg_color_rgb}"
    )
    return is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb


def _detect_vertical_subgutters(
    slice_gray: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    median_bg: float,
    min_col_gutter_px: int = 12
) -> List[Tuple[int, int]]:
    """
    Scans a horizontal panel slice for vertical column gutters (splitting side-by-side panels).
    Returns list of (x_start, x_end) content column ranges.
    """
    sh, sw = slice_gray.shape
    if sw < min_col_gutter_px * 3:
        return [(0, sw)]

    col_stds = np.std(slice_gray, axis=0)
    if is_white_bg:
        bg_col_counts = np.sum(slice_gray > threshold_val, axis=0)
    else:
        bg_col_counts = np.sum(slice_gray < threshold_val, axis=0)
    col_bg_ratios = bg_col_counts / float(max(1, sh))

    is_col_gutter = (col_bg_ratios >= 0.70) | ((col_stds < 6.0) & (col_bg_ratios >= 0.50))
    is_col_content = ~is_col_gutter

    sub_cols: List[Tuple[int, int]] = []
    in_col = False
    col_start = 0
    for x in range(sw):
        if is_col_content[x] and not in_col:
            in_col = True
            col_start = x
        elif not is_col_content[x] and in_col:
            in_col = False
            col_end = x
            if col_end - col_start >= int(sw * 0.10):
                sub_cols.append((col_start, col_end))
    if in_col:
        col_end = sw
        if col_end - col_start >= int(sw * 0.10):
            sub_cols.append((col_start, col_end))

    return sub_cols if sub_cols else [(0, sw)]


def _detect_panels_webtoon(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None,
    median_bg: Optional[float] = None,
    sensitivity: float = 30.0,
    gutter_bg_ratio: float = 0.55,
    gutter_std_thresh: float = 8.0,
    gutter_flat_bg_ratio: float = 0.45,
    top_median: Optional[float] = None,
    bottom_median: Optional[float] = None,
    enable_x_trimming: bool = True,
    enable_column_split: bool = True,
    high_sensitivity: bool = False
) -> List[Dict[str, Any]]:
    """
    High-precision Webtoon vertical strip slicing strategy with gradient baseline support,
    Speech Bubble Protection, horizontal X-margin trimming, and multi-column panel splitting.
    """
    h, w = gray_arr.shape
    logger.debug(
        f"[Panel Webtoon Detect] Slicing {w}x{h} strip (min_height_px={min_height_px}, "
        f"gutter_bg_ratio={gutter_bg_ratio:.2f}, high_sensitivity={high_sensitivity})"
    )
    margin = max(4, min(60, int(w * 0.08)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    if high_sensitivity:
        gutter_bg_ratio = max(0.35, gutter_bg_ratio - 0.10)
        gutter_flat_bg_ratio = max(0.30, gutter_flat_bg_ratio - 0.10)
        gutter_std_thresh = gutter_std_thresh + 4.0

    row_stds = np.std(gray_center, axis=1)

    # Compute dual solid-color gutter rows (white or black)
    row_means = np.mean(gray_center, axis=1)

    is_white_gutter = (row_means >= 240) & (row_stds < 12.0)
    is_black_gutter = (row_means <= 15) & (row_stds < 12.0)

    # Gutter rows: explicitly white or black
    is_gutter_row = is_white_gutter | is_black_gutter
    is_content_row = ~is_gutter_row

    # Anchor Integration: Protect YOLO detected regions and OCR boxes from being sliced.
    # We treat any provided OCR or YOLO box as guaranteed content.
    if ocr_boxes:
        content_pad = max(2, int(w * 0.005))
        for box in ocr_boxes:
            by1 = max(0, int(box.get("y", 0)) - content_pad)
            by2 = min(h, int(box.get("y", 0) + box.get("h", 0)) + content_pad)
            if by2 > by1:
                is_content_row[by1:by2] = True

    # 1. Identify gutter cut-points between panels
    is_gutter_row = ~is_content_row
    cut_points: List[int] = []
    
    in_gutter = False
    g_start = 0
    min_gutter_h = max(2, min(10, int(w * 0.008)))
    
    for i in range(h):
        if is_gutter_row[i] and not in_gutter:
            in_gutter = True
            g_start = i
        elif not is_gutter_row[i] and in_gutter:
            in_gutter = False
            g_end = i
            if g_end - g_start >= min_gutter_h:
                cut_y = (g_start + g_end) // 2
                cut_points.append(cut_y)
    if in_gutter:
        g_end = h
        if g_end - g_start >= min_gutter_h:
            cut_y = (g_start + g_end) // 2
            cut_points.append(cut_y)

    # 2. Form continuous gapless vertical slices from y=0 to y=h
    raw_cuts = [0] + cut_points + [h]
    
    # Filter/merge cut points that create slices smaller than min_height_px
    merged_cuts: List[int] = [0]
    for cut in raw_cuts[1:]:
        if cut - merged_cuts[-1] >= min_height_px:
            merged_cuts.append(cut)
        else:
            # Merge tiny slice into the preceding slice
            if cut == h and len(merged_cuts) > 1:
                merged_cuts[-1] = h

    if merged_cuts[-1] < h:
        if h - merged_cuts[-1] < min_height_px and len(merged_cuts) > 1:
            merged_cuts[-1] = h
        else:
            merged_cuts.append(h)

    vertical_slices: List[Tuple[int, int]] = []
    for k in range(len(merged_cuts) - 1):
        s_y = merged_cuts[k]
        e_y = merged_cuts[k + 1]
        if e_y - s_y >= 10:
            vertical_slices.append((s_y, e_y))

    raw_boxes: List[Dict[str, Any]] = []
    med_bg_val = median_bg if median_bg is not None else (255.0 if is_white_bg else 0.0)

    for start_y, end_y in vertical_slices:
        slice_h = end_y - start_y
        slice_gray = gray_arr[start_y:end_y, :]

        # 1. Column subdivision check for multi-column horizontal strips
        col_ranges = [(0, w)]
        if enable_column_split and w >= 300 and slice_h < int(w * 1.2):
            col_ranges = _detect_vertical_subgutters(slice_gray, is_white_bg, threshold_val, med_bg_val)

        for col_x1, col_x2 in col_ranges:
            col_w = col_x2 - col_x1
            if col_w < int(w * min_width_pct):
                continue

            sub_slice = slice_gray[:, col_x1:col_x2]

            # 2. X-axis margin trimming to tighten panel side gutters
            final_x = col_x1
            final_w = col_w
            if enable_x_trimming and col_w > 40:
                col_stds = np.std(sub_slice, axis=0)
                if is_white_bg:
                    col_bg_ratio = np.sum(sub_slice > threshold_val, axis=0) / float(slice_h)
                else:
                    col_bg_ratio = np.sum(sub_slice < threshold_val, axis=0) / float(slice_h)

                content_cols = (col_bg_ratio < 0.92) | (col_stds > 4.0)
                if np.any(content_cols):
                    valid_indices = np.where(content_cols)[0]
                    left_pad = max(0, valid_indices[0] - 4)
                    right_pad = min(col_w, valid_indices[-1] + 5)
                    
                    # Protect speech bubbles projecting outside
                    if ocr_boxes:
                        for box in ocr_boxes:
                            bx = int(box.get("x", 0))
                            by = int(box.get("y", 0))
                            bw_b = int(box.get("w", 0))
                            bh_b = int(box.get("h", 0))
                            if not (by + bh_b < start_y or by > end_y):
                                bx1_rel = max(0, bx - col_x1)
                                bx2_rel = min(col_w, (bx + bw_b) - col_x1)
                                if bx2_rel > bx1_rel:
                                    left_pad = min(left_pad, bx1_rel)
                                    right_pad = max(right_pad, bx2_rel)

                    final_x = col_x1 + left_pad
                    final_w = max(10, right_pad - left_pad)

            # 3. Y-axis margin trimming to tighten top/bottom gutter whitespace
            final_y = start_y
            final_h = slice_h
            if slice_h > 40:
                row_stds = np.std(sub_slice, axis=1)
                if is_white_bg:
                    row_bg_ratio = np.sum(sub_slice > threshold_val, axis=1) / float(max(1, col_w))
                else:
                    row_bg_ratio = np.sum(sub_slice < threshold_val, axis=1) / float(max(1, col_w))

                content_rows = (row_bg_ratio < 0.975) | (row_stds > 2.5)
                if ocr_boxes:
                    for box in ocr_boxes:
                        bx = int(box.get("x", 0))
                        by = int(box.get("y", 0))
                        bw_b = int(box.get("w", 0))
                        bh_b = int(box.get("h", 0))
                        if not (bx + bw_b < col_x1 or bx > col_x2):
                            by1_rel = max(0, by - start_y)
                            by2_rel = min(slice_h, (by + bh_b) - start_y)
                            if by2_rel > by1_rel:
                                content_rows[by1_rel:by2_rel] = True

                if np.any(content_rows):
                    valid_y_indices = np.where(content_rows)[0]
                    dynamic_pad = max(2, int(w * 0.005))
                    top_pad = max(0, valid_y_indices[0] - dynamic_pad)
                    bot_pad = min(slice_h, valid_y_indices[-1] + dynamic_pad)
                    final_y = start_y + top_pad
                    final_h = max(15, bot_pad - top_pad)

            raw_boxes.append({
                "x": final_x,
                "y": final_y,
                "w": final_w,
                "h": final_h
            })

    return raw_boxes
