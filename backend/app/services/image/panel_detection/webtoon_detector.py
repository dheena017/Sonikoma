"""
backend/app/services/image/panel_detector/webtoon_detect.py
─────────────────────────────────────────────────────────────────────────────
High-precision Webtoon vertical strip slicing algorithms, adaptive multi-channel
background detection, gradient baseline tracking, and column subdivision.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Any, Union

from services.image.utils.panel_box_utils import protect_slice_x, protect_slice_y

logger = logging.getLogger("sonikoma.services.image.panel_detection.webtoon_detector")


@dataclass
class PanelDetectionResult:
    panels: List[Dict[str, Any]]
    separator_bands: List[int]
    gutter_ranges: List[Tuple[int, int]]
    separator_mask: Optional[np.ndarray] = None
    content_mask: Optional[np.ndarray] = None
    separator_scores: Optional[np.ndarray] = None

    def __iter__(self):
        yield self.panels
        yield self.separator_bands
        yield self.gutter_ranges


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
            inset_y = max(1, int(h * 0.02))
            inset_x = max(1, int(w * 0.02))
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


def _classify_content_rows(
    sub_slice: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    col_w: int,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None,
    start_y: int = 0,
    end_y: int = 0,
    col_x1: int = 0,
    col_x2: int = 0
) -> np.ndarray:
    """
    Classifies rows within a vertical panel slice as content vs empty background.
    Evaluates center content column to avoid full-width dilution by side margins,
    ensuring speech bubbles and floating dialogue are properly recognized as content.
    """
    slice_h = sub_slice.shape[0]
    margin_x = max(2, int(col_w * 0.15))
    center_slice = sub_slice[:, margin_x:-margin_x] if col_w > margin_x * 2 else sub_slice
    center_w = max(1, center_slice.shape[1])

    # Sample local top 20px and bottom 20px background color per slice
    band_y = max(1, min(20, int(slice_h * 0.10)))
    slice_top_bg = float(np.median(center_slice[:band_y, :]))
    slice_bot_bg = float(np.median(center_slice[-band_y:, :]))
    slice_bg_med = float(np.median(np.concatenate([center_slice[:band_y, :].ravel(), center_slice[-band_y:, :].ravel()])))

    is_local_white = (slice_bg_med > 127.0)
    local_thresh = int(min(252, max(140, slice_bg_med - 20.0))) if is_local_white else int(max(8, min(115, slice_bg_med + 20.0)))

    center_stds = np.std(center_slice, axis=1)
    if is_local_white:
        center_bg_ratio = np.sum(center_slice > local_thresh, axis=1) / float(center_w)
    else:
        center_bg_ratio = np.sum(center_slice < local_thresh, axis=1) / float(center_w)

    center_diffs = np.abs(np.diff(center_slice.astype(float), axis=1))
    center_text_strokes = np.sum(center_diffs > 10.0, axis=1)

    content_rows = (center_bg_ratio < 0.92) | (center_stds > 1.5) | (center_text_strokes >= 1)

    if ocr_boxes:
        bubble_pad = max(15, min(60, int(slice_h * 0.05)))
        for box in ocr_boxes:
            bx = int(box.get("x", 0))
            by = int(box.get("y", 0))
            bw_b = int(box.get("w", 0))
            bh_b = int(box.get("h", 0))
            if bh_b >= int(slice_h * 0.85):
                continue
            if not (bx + bw_b < col_x1 or bx > col_x2):
                by1_rel = max(0, by - start_y - bubble_pad)
                by2_rel = min(slice_h, (by + bh_b) - start_y + bubble_pad)
                if by2_rel > by1_rel:
                    content_rows[by1_rel:by2_rel] = True

    # Edge noise suppression for full-image outer boundaries (y=0 or bottom edge)
    if start_y == 0:
        for r in range(min(15, slice_h)):
            if center_bg_ratio[r] >= 0.95:
                content_rows[r] = False

    return content_rows


def _compute_trim_bounds(
    content_rows: np.ndarray,
    slice_h: int,
    w: int,
    padding_px: Optional[int] = None
) -> Tuple[int, int, int, int]:
    """
    Computes top and bottom trim offsets (px) from content row mask with safety padding and dynamic cap.
    Returns (top_pad, final_h, top_removed, bottom_removed).
    """
    if not np.any(content_rows):
        return 0, slice_h, 0, 0

    valid_y_indices = np.where(content_rows)[0]
    if padding_px is None:
        padding_px = max(2, min(8, int(w * 0.01)))

    top_pad = max(0, valid_y_indices[0] - padding_px)
    bot_pad = min(slice_h, valid_y_indices[-1] + padding_px)

    # Dynamic Trim Cap: min(80px, slice_h * 0.08)
    max_trim_px = min(80, max(10, int(slice_h * 0.08)))
    top_pad = min(top_pad, max_trim_px)
    bot_pad = max(bot_pad, slice_h - max_trim_px)

    final_h = max(15, bot_pad - top_pad)
    top_removed = top_pad
    bottom_removed = slice_h - bot_pad

    return top_pad, final_h, top_removed, bottom_removed


def detect_vertical_strip_panels(
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
    high_sensitivity: bool = False,
    padding_px: Optional[int] = None
) -> PanelDetectionResult:
    """
    Universal high-precision vertical strip slicing strategy for all web comic sites, manhwa, manga & vertical strips
    with gradient baseline support, Speech Bubble Protection, horizontal X-margin trimming, and multi-column panel splitting.
    """
    h, w = gray_arr.shape
    logger.debug(
        f"[Panel Webtoon Detect] Slicing {w}x{h} strip (min_height_px={min_height_px}, "
        f"gutter_bg_ratio={gutter_bg_ratio:.2f}, high_sensitivity={high_sensitivity})"
    )
    margin = max(4, min(60, int(w * 0.08)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    effective_gutter_bg_ratio = max(0.75, min(0.90, gutter_bg_ratio))

    if high_sensitivity:
        effective_gutter_bg_ratio = max(0.65, effective_gutter_bg_ratio - 0.10)
        gutter_flat_bg_ratio = max(0.35, gutter_flat_bg_ratio - 0.10)
        gutter_std_thresh = gutter_std_thresh + 4.0

    # Vectorized row-by-row background color estimation for multi-scene Webtoon slicing
    row_stds = np.std(gray_center, axis=1)
    row_diffs = np.abs(np.diff(gray_center.astype(float), axis=1))
    stroke_counts = np.sum(row_diffs > 15.0, axis=1)
    row_grads = np.abs(np.gradient(gray_center.astype(float), axis=1))
    edge_counts = np.sum(row_grads > 10.0, axis=1)

    row_medians = np.median(gray_center, axis=1)
    bg_tolerance = max(15.0, min(35.0, sensitivity * 0.8))
    bg_pixel_count = np.sum(np.abs(gray_center.astype(float) - row_medians[:, np.newaxis]) <= bg_tolerance, axis=1)
    bg_ratio = bg_pixel_count / float(max(1, w_center))

    # Phase 2.1A: Multi-Feature Composite Separator Score Calculation
    med_std = float(np.median(row_stds))
    mad_std = float(np.median(np.abs(row_stds - med_std)))
    mad_norm_std = np.clip((row_stds - med_std) / (1.4826 * mad_std + 1e-5), 0.0, 5.0)

    stroke_density = stroke_counts / float(max(1, w_center))
    stroke_score = np.clip(1.0 - (stroke_density * 12.0), 0.0, 1.0)

    edge_density = edge_counts / float(max(1, w_center))
    edge_score = np.clip(1.0 - (edge_density * 10.0), 0.0, 1.0)

    mad_score = np.clip(1.0 - (mad_norm_std / 3.0), 0.0, 1.0)

    separator_score = (
        0.45 * bg_ratio +
        0.20 * stroke_score +
        0.20 * edge_score +
        0.15 * mad_score
    )

    sep_threshold = 0.50 if high_sensitivity else 0.70
    is_gutter_row = (
        (separator_score >= sep_threshold) &
        (stroke_counts < 1) &
        (bg_ratio >= effective_gutter_bg_ratio) &
        (edge_density <= 0.12)
    )
    is_content_row = ~is_gutter_row

    if ocr_boxes:
        bubble_pad = max(10, min(50, int(h * 0.04)))
        max_ocr_h = min(600, max(100, int(h * 0.12)))
        sorted_ocr = sorted(ocr_boxes, key=lambda b: int(b.get("y", 0)))
        for idx, box in enumerate(sorted_ocr):
            bh_b = int(box.get("h", 0))
            if bh_b >= max_ocr_h:
                continue
            by1 = max(0, int(box.get("y", 0)) - bubble_pad)
            by2 = min(h, int(box.get("y", 0) + bh_b) + bubble_pad)
            if by2 > by1:
                is_content_row[by1:by2] = True

            # Bridge small gaps between adjacent UI elements (e.g., item icon + notification text box)
            if idx + 1 < len(sorted_ocr):
                nxt_box = sorted_ocr[idx + 1]
                gap_between = int(nxt_box.get("y", 0)) - (int(box.get("y", 0)) + bh_b)
                if 0 <= gap_between <= 120:
                    bridge_start = max(0, int(box.get("y", 0)))
                    bridge_end = min(h, int(nxt_box.get("y", 0)) + int(nxt_box.get("h", 0)))
                    is_content_row[bridge_start:bridge_end] = True

    is_gutter_row = ~is_content_row

    # Telemetry: Log candidate rows that were rejected
    rejected_log_count = 0
    for y_idx in range(0, h, max(1, h // 200)):
        sc = separator_score[y_idx]
        if 0.40 <= sc < sep_threshold and rejected_log_count < 10:
            logger.debug(
                f"[Separator Rejection] y={y_idx}, score={sc:.2f}, bg_ratio={bg_ratio[y_idx]:.2f}, "
                f"stroke_density={stroke_density[y_idx]:.2f}, edge_density={edge_density[y_idx]:.2f}, threshold={sep_threshold:.2f}"
            )
            rejected_log_count += 1

    cut_points: List[int] = []
    gutter_heights: List[int] = []
    gutter_ranges_list: List[Tuple[int, int]] = []
    
    in_gutter = False
    g_start = 0
    min_gutter_h = max(16, min(40, int(w * 0.03)))

    for i in range(h):
        if is_gutter_row[i] and not in_gutter:
            in_gutter = True
            g_start = i
        elif not is_gutter_row[i] and in_gutter:
            in_gutter = False
            g_end = i
            gh = g_end - g_start
            if gh >= min_gutter_h:
                avg_bg_ratio = float(np.mean(bg_ratio[g_start:g_end]))
                avg_std = float(np.mean(row_stds[g_start:g_end]))
                if avg_bg_ratio >= effective_gutter_bg_ratio and avg_std <= gutter_std_thresh * 1.25:
                    above_idx = max(0, g_start - 1)
                    below_idx = min(h - 1, g_end)
                    adjacent_content = (
                        (not is_gutter_row[above_idx]) or
                        (not is_gutter_row[below_idx]) or
                        (row_stds[above_idx] > gutter_std_thresh * 0.6) or
                        (row_stds[below_idx] > gutter_std_thresh * 0.6)
                    )
                    if adjacent_content:
                        cut_y = (g_start + g_end) // 2
                        cut_points.append(cut_y)
                        gutter_heights.append(gh)
                        gutter_ranges_list.append((g_start, g_end))
    if in_gutter:
        g_end = h
        gh = g_end - g_start
        if gh >= min_gutter_h:
            avg_bg_ratio = float(np.mean(bg_ratio[g_start:g_end]))
            avg_std = float(np.mean(row_stds[g_start:g_end]))
            if avg_bg_ratio >= effective_gutter_bg_ratio and avg_std <= gutter_std_thresh * 1.25:
                above_idx = max(0, g_start - 1)
                below_idx = min(h - 1, g_end - 1)
                adjacent_content = (
                    (not is_gutter_row[above_idx]) or
                    (not is_gutter_row[below_idx]) or
                    (row_stds[above_idx] > gutter_std_thresh * 0.6) or
                    (row_stds[below_idx] > gutter_std_thresh * 0.6)
                )
                if adjacent_content:
                    cut_y = (g_start + g_end) // 2
                    cut_points.append(cut_y)
                    gutter_heights.append(gh)
                    gutter_ranges_list.append((g_start, g_end))

    avg_sep_h = float(np.mean(gutter_heights)) if gutter_heights else 0.0
    max_sep_h = int(np.max(gutter_heights)) if gutter_heights else 0
    logger.info(
        f"[Panel Webtoon Detect] Found {len(cut_points)} separator cut points "
        f"(avg_h={avg_sep_h:.1f}px, max_h={max_sep_h}px, sep_threshold={sep_threshold:.2f})"
    )

    raw_cuts = [0] + cut_points + [h]
    
    merged_cuts: List[int] = [0]
    for cut in raw_cuts[1:]:
        if cut - merged_cuts[-1] >= min_height_px:
            merged_cuts.append(cut)
        else:
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

    for panel_idx, (start_y, end_y) in enumerate(vertical_slices, start=1):
        slice_h = end_y - start_y
        slice_gray = gray_arr[start_y:end_y, :]

        col_ranges = [(0, w)]
        if enable_column_split and w >= 300 and slice_h < int(w * 1.2):
            col_ranges = _detect_vertical_subgutters(slice_gray, is_white_bg, threshold_val, med_bg_val)

        for col_x1, col_x2 in col_ranges:
            col_w = col_x2 - col_x1
            if col_w < int(w * min_width_pct):
                continue

            sub_slice = slice_gray[:, col_x1:col_x2]

            final_x = col_x1
            final_w = col_w
            if enable_x_trimming and col_w > 40:
                col_stds = np.std(sub_slice, axis=0)
                if is_white_bg:
                    col_bg_ratio = np.sum(sub_slice > threshold_val, axis=0) / float(slice_h)
                else:
                    col_bg_ratio = np.sum(sub_slice < threshold_val, axis=0) / float(slice_h)

                content_cols = (col_bg_ratio < 0.92) | ((col_bg_ratio < 0.98) & (col_stds > 3.0))
                if np.any(content_cols):
                    valid_indices = np.where(content_cols)[0]
                    left_pad = max(0, valid_indices[0] - 4)
                    right_pad = min(col_w, valid_indices[-1] + 5)
                    
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

            final_y = start_y
            final_h = slice_h
            top_removed_px = 0
            bottom_removed_px = 0

            if slice_h > 40:
                c_rows = _classify_content_rows(
                    sub_slice, is_white_bg, threshold_val, col_w,
                    ocr_boxes=ocr_boxes, start_y=start_y, end_y=end_y,
                    col_x1=col_x1, col_x2=col_x2
                )
                if not np.any(c_rows):
                    logger.debug(f"[Panel Webtoon Detect] Skipping empty gutter slice [{start_y} -> {end_y}]")
                    continue

                top_pad, calc_h, top_removed_px, bottom_removed_px = _compute_trim_bounds(c_rows, slice_h, w, padding_px=padding_px)
                if calc_h < min_height_px:
                    logger.debug(f"[Panel Webtoon Detect] Skipping sub-min-height trimmed slice [{start_y} -> {end_y}] ({calc_h}px < {min_height_px}px)")
                    continue

                final_y = start_y + top_pad
                final_h = calc_h

                # Expand panel crop bounds to guarantee speech bubbles and header text are 100% included
                if ocr_boxes:
                    for box in ocr_boxes:
                        bx1 = int(box.get("x", 0))
                        by1 = int(box.get("y", 0))
                        bw_b = int(box.get("w", 0))
                        bh_b = int(box.get("h", 0))
                        bx2 = bx1 + bw_b
                        by2 = by1 + bh_b

                        if not (bx2 < col_x1 or bx1 > col_x2):
                            if (start_y - 180) <= by1 <= (final_y + 150):
                                expanded_y1 = max(0, by1 - 25)
                                if expanded_y1 < final_y:
                                    diff = final_y - expanded_y1
                                    final_y = expanded_y1
                                    final_h += diff

                            if (final_y + final_h - 150) <= by2 <= (end_y + 180):
                                expanded_y2 = min(h, by2 + 25)
                                if expanded_y2 > (final_y + final_h):
                                    final_h = expanded_y2 - final_y

            logger.debug(
                f"[Panel Webtoon Detect] Panel {panel_idx}: "
                f"Slice=[{start_y} -> {end_y}] ({slice_h}px), "
                f"Trimmed=[{final_y} -> {final_y + final_h}] ({final_h}px), "
                f"Top removed={top_removed_px}px, Bottom removed={bottom_removed_px}px"
            )

            final_slice = gray_arr[final_y:final_y + final_h, final_x:final_x + final_w]
            bubble_bg_ratio = 0.0
            bubble_stroke_count = 0
            if final_slice.size > 0:
                if is_white_bg:
                    bg_pixels = final_slice > threshold_val
                else:
                    bg_pixels = final_slice < threshold_val
                bubble_bg_ratio = float(np.mean(bg_pixels))
                if final_slice.shape[1] > 1:
                    bubble_stroke_count = int(np.sum(np.abs(np.diff(final_slice.astype(float), axis=1)) > 15.0))

            has_ocr_overlap = False
            if ocr_boxes:
                fx2 = final_x + final_w
                fy2 = final_y + final_h
                for box in ocr_boxes:
                    bx1 = int(box.get("x", 0))
                    by1 = int(box.get("y", 0))
                    bx2 = bx1 + int(box.get("w", 0))
                    by2 = by1 + int(box.get("h", 0))
                    if max(final_x, bx1) < min(fx2, bx2) and max(final_y, by1) < min(fy2, by2):
                        has_ocr_overlap = True
                        break

            bubble_candidate = (
                final_h < 300 and
                (
                    has_ocr_overlap or
                    (bubble_bg_ratio >= 0.55 and bubble_stroke_count >= 4)
                )
            )

            raw_boxes.append({
                "x": final_x,
                "y": final_y,
                "w": final_w,
                "h": final_h,
                "top_removed_px": top_removed_px,
                "bottom_removed_px": bottom_removed_px,
                "slice_start_y": start_y,
                "slice_end_y": end_y,
                "bubble_candidate": bubble_candidate
            })

    # Speech Bubble & Floating Text Slice Post-Processing Unification
    if len(raw_boxes) > 1:
        unifying = True
        while unifying:
            unifying = False
            unified_boxes: List[Dict[str, Any]] = []
            skip_indices = set()

            for i in range(len(raw_boxes)):
                if i in skip_indices:
                    continue
                curr = raw_boxes[i]

                if i + 1 < len(raw_boxes):
                    nxt = raw_boxes[i + 1]
                    gap_y = nxt["y"] - (curr["y"] + curr["h"])

                    is_curr_bubble = curr["h"] < 180 or curr.get("bubble_candidate", False)
                    is_nxt_bubble = nxt["h"] < 180 or nxt.get("bubble_candidate", False)

                    gap_start = curr["y"] + curr["h"]
                    gap_end = nxt["y"]
                    separator_in_gap = False
                    if gap_start < gap_end:
                        for cp in cut_points:
                            if gap_start <= cp <= gap_end:
                                separator_in_gap = True
                                break
                        if not separator_in_gap:
                            for g_start, g_end in gutter_ranges_list:
                                if max(gap_start, g_start) < min(gap_end, g_end):
                                    separator_in_gap = True
                                    break

                    curr_center = curr["x"] + (curr["w"] / 2.0)
                    nxt_center = nxt["x"] + (nxt["w"] / 2.0)
                    center_tolerance = max(30.0, min(curr["w"], nxt["w"]) * 0.12)
                    same_x_center = abs(curr_center - nxt_center) <= center_tolerance
                    x_overlap = max(
                        0,
                        min(curr["x"] + curr["w"], nxt["x"] + nxt["w"]) - max(curr["x"], nxt["x"])
                    )
                    x_overlap_ratio = x_overlap / float(max(1, min(curr["w"], nxt["w"])))

                    is_dark_or_continuous_gap = False
                    if gap_start < gap_end and gap_end - gap_start <= 180:
                        gap_sample = gray_arr[gap_start:gap_end, :]
                        if gap_sample.size > 0 and float(np.median(gap_sample)) < 200.0:
                            is_dark_or_continuous_gap = True

                    is_ui_or_bubble = (
                        is_curr_bubble or is_nxt_bubble or is_dark_or_continuous_gap
                    )

                    should_unify = False
                    if is_ui_or_bubble and (same_x_center or x_overlap_ratio >= 0.35):
                        if is_dark_or_continuous_gap and not separator_in_gap:
                            should_unify = True
                        elif (is_curr_bubble or is_nxt_bubble) and gap_y <= 140:
                            should_unify = True

                    if gap_y <= 180 and should_unify:
                        merged_x1 = min(curr["x"], nxt["x"])
                        merged_y1 = min(curr["y"], nxt["y"])
                        merged_x2 = max(curr["x"] + curr["w"], nxt["x"] + nxt["w"])
                        merged_y2 = max(curr["y"] + curr["h"], nxt["y"] + nxt["h"])

                        logger.debug(
                            f"[Panel Webtoon Detect] Unifying dark-background scene sequence / UI box at y={curr['y']} with panel at y={nxt['y']} (gap={gap_y}px)"
                        )

                        unified_boxes.append({
                            "x": merged_x1,
                            "y": merged_y1,
                            "w": merged_x2 - merged_x1,
                            "h": merged_y2 - merged_y1,
                            "top_removed_px": curr.get("top_removed_px", 0),
                            "bottom_removed_px": nxt.get("bottom_removed_px", 0),
                            "slice_start_y": curr.get("slice_start_y", curr["y"]),
                            "slice_end_y": nxt.get("slice_end_y", nxt["y"] + nxt["h"]),
                            "bubble_candidate": curr.get("bubble_candidate", False) or nxt.get("bubble_candidate", False)
                        })
                        skip_indices.add(i + 1)
                        unifying = True
                        continue

                unified_boxes.append(curr)

            raw_boxes = unified_boxes

    return PanelDetectionResult(
        panels=raw_boxes,
        separator_bands=cut_points,
        gutter_ranges=gutter_ranges_list,
        separator_mask=is_gutter_row.copy(),
        content_mask=is_content_row.copy(),
        separator_scores=separator_score.copy(),
    )


# Backward-compatibility alias
_detect_panels_webtoon = detect_vertical_strip_panels

