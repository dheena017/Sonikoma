"""
backend/app/services/image/panel_detection/panel_detector.py
─────────────────────────────────────────────────────────────────────────────
Unified Panel Detection & Webtoon Slicing Engine:
- High-precision Webtoon vertical strip slicing (detect_vertical_strip_panels)
- Multi-feature background detection & gradient baseline tracking (_detect_bg_color_and_threshold)
- 100% empty gutter whitespace trimming (_compute_trim_bounds)
- Sub-column horizontal panel splitting (_detect_vertical_subgutters)
- Visual reading order sequencing (_sort_panels_reading_order)
- Continuous art scene subdivision (_subdivide_continuous_tall_art_panel)
- Solid border margin trimming (trim_solid_borders)
- Modular execution delegator (run_cv_detection / detect_panels_in_image)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Any, Union
from PIL import Image
import numpy as np

try:
    import cv2
    HAS_CV = True
except ImportError:
    cv2 = None
    HAS_CV = False

from services.image.panel_detection.opencv_detector import detect_opencv_boxes
from services.image.panel_detection.grid_detector import detect_manga_grid_panels

logger = logging.getLogger("sonikoma.services.image.panel_detection.panel_detector")


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

    # Column gutter requires near-complete top-to-bottom gutter whitespace
    is_col_gutter = (col_bg_ratios >= 0.88) & (col_stds < 5.0)
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
            if col_end - col_start >= int(sw * 0.25):
                sub_cols.append((col_start, col_end))
    if in_col:
        col_end = sw
        if col_end - col_start >= int(sw * 0.25):
            sub_cols.append((col_start, col_end))

    # If there is only 1 detected column spanning across, keep full width
    if len(sub_cols) <= 1:
        return [(0, sw)]

    return sub_cols


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
    """
    slice_h = sub_slice.shape[0]
    margin_x = max(2, int(col_w * 0.15))
    center_slice = sub_slice[:, margin_x:-margin_x] if col_w > margin_x * 2 else sub_slice
    center_w = max(1, center_slice.shape[1])

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

    return content_rows


def _compute_trim_bounds(
    content_rows: np.ndarray,
    slice_h: int,
    w: int,
    padding_px: Optional[int] = None
) -> Tuple[int, int, int, int]:
    """
    Computes top and bottom trim offsets (px) from content row mask with safety padding.
    Trims away 100% of empty gutter whitespace above and below the panel content.
    Returns (top_pad, final_h, top_removed, bottom_removed).
    """
    if not np.any(content_rows):
        return 0, slice_h, 0, 0

    valid_y_indices = np.where(content_rows)[0]
    pad = max(2, int(w * 0.005)) if padding_px is None else padding_px

    top_pad = max(0, valid_y_indices[0] - pad)
    bot_pad = min(slice_h, valid_y_indices[-1] + pad + 1)

    final_h = max(10, bot_pad - top_pad)
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
    Universal high-precision vertical strip slicing strategy for continuous webtoon scrolls
    with gradient tracking, Speech Bubble Protection, horizontal X-margin trimming, and subgutters.
    """
    h, w = gray_arr.shape
    margin = max(4, min(60, int(w * 0.08)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    effective_gutter_bg_ratio = max(0.35, min(0.65, gutter_bg_ratio))

    if high_sensitivity:
        effective_gutter_bg_ratio = max(0.25, effective_gutter_bg_ratio - 0.10)
        gutter_flat_bg_ratio = max(0.25, gutter_flat_bg_ratio - 0.10)
        gutter_std_thresh = gutter_std_thresh + 6.0

    # Vectorized row-by-row background estimation
    row_stds = np.std(gray_center, axis=1)
    row_diffs = np.abs(np.diff(gray_center.astype(float), axis=1))
    stroke_counts = np.sum(row_diffs > 18.0, axis=1)
    row_grads = np.abs(np.gradient(gray_center.astype(float), axis=1))
    edge_counts = np.sum(row_grads > 12.0, axis=1)

    row_medians = np.median(gray_center, axis=1)
    bg_tolerance = max(18.0, min(40.0, sensitivity * 0.9))
    bg_pixel_count = np.sum(np.abs(gray_center.astype(float) - row_medians[:, np.newaxis]) <= bg_tolerance, axis=1)
    bg_ratio = bg_pixel_count / float(max(1, w_center))

    med_std = float(np.median(row_stds))
    mad_std = float(np.median(np.abs(row_stds - med_std)))
    mad_norm_std = np.clip((row_stds - med_std) / (1.4826 * mad_std + 1e-5), 0.0, 5.0)

    stroke_density = stroke_counts / float(max(1, w_center))
    stroke_score = np.clip(1.0 - (stroke_density * 10.0), 0.0, 1.0)

    edge_density = edge_counts / float(max(1, w_center))
    edge_score = np.clip(1.0 - (edge_density * 8.0), 0.0, 1.0)

    mad_score = np.clip(1.0 - (mad_norm_std / 3.0), 0.0, 1.0)

    separator_score = (
        0.45 * bg_ratio +
        0.20 * stroke_score +
        0.20 * edge_score +
        0.15 * mad_score
    )

    sep_threshold = 0.35 if high_sensitivity else 0.40
    max_stroke_count = max(2, int(w_center * 0.015))
    is_gutter_row = (
        (stroke_counts <= max_stroke_count) &
        ((separator_score >= sep_threshold) | (bg_ratio >= 0.40) | (row_stds <= gutter_std_thresh * 1.8)) &
        (edge_density <= 0.15)
    )
    is_content_row = ~is_gutter_row

    if ocr_boxes:
        bubble_pad = max(4, int(w * 0.02))
        max_ocr_h = int(w * 1.25)
        sorted_ocr = sorted(ocr_boxes, key=lambda b: int(b.get("y", 0)))
        for idx, box in enumerate(sorted_ocr):
            bh_b = int(box.get("h", 0))
            if bh_b >= max_ocr_h:
                continue
            by1 = max(0, int(box.get("y", 0)) - bubble_pad)
            by2 = min(h, int(box.get("y", 0) + bh_b) + bubble_pad)
            if by2 > by1:
                is_content_row[by1:by2] = True

            if idx + 1 < len(sorted_ocr):
                nxt_box = sorted_ocr[idx + 1]
                gap_between = int(nxt_box.get("y", 0)) - (int(box.get("y", 0)) + bh_b)
                max_bridge_gap = max(6, int(w * 0.03))
                if 0 <= gap_between <= max_bridge_gap:
                    bridge_start = max(0, int(box.get("y", 0)))
                    bridge_end = min(h, int(nxt_box.get("y", 0)) + int(nxt_box.get("h", 0)))
                    is_content_row[bridge_start:bridge_end] = True

    is_gutter_row = ~is_content_row

    cut_points: List[int] = []
    gutter_heights: List[int] = []
    gutter_ranges_list: List[Tuple[int, int]] = []
    
    in_gutter = False
    g_start = 0
    min_gutter_h = max(6, int(w * 0.015))

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
                if (avg_bg_ratio >= effective_gutter_bg_ratio or avg_std <= gutter_std_thresh * 2.0):
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
            if (avg_bg_ratio >= effective_gutter_bg_ratio or avg_std <= gutter_std_thresh * 2.0):
                cut_y = (g_start + g_end) // 2
                cut_points.append(cut_y)
                gutter_heights.append(gh)
                gutter_ranges_list.append((g_start, g_end))

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
                    continue

                top_pad, calc_h, top_removed_px, bottom_removed_px = _compute_trim_bounds(c_rows, slice_h, w, padding_px=padding_px)
                if calc_h < min_height_px:
                    continue

                final_y = start_y + top_pad
                final_h = calc_h

                if ocr_boxes:
                    for box in ocr_boxes:
                        bx1 = int(box.get("x", 0))
                        by1 = int(box.get("y", 0))
                        bw_b = int(box.get("w", 0))
                        bh_b = int(box.get("h", 0))
                        bx2 = bx1 + bw_b
                        by2 = by1 + bh_b

                        if not (bx2 < col_x1 or bx1 > col_x2):
                            reach_dist = max(20, int(w * 0.20))
                            pad_dist = max(4, int(w * 0.03))
                            if (start_y - reach_dist) <= by1 <= (final_y + reach_dist):
                                expanded_y1 = max(0, by1 - pad_dist)
                                if expanded_y1 < final_y:
                                    diff = final_y - expanded_y1
                                    final_y = expanded_y1
                                    final_h += diff

                            if (final_y + final_h - reach_dist) <= by2 <= (end_y + reach_dist):
                                expanded_y2 = min(h, by2 + pad_dist)
                                if expanded_y2 > (final_y + final_h):
                                    final_h = expanded_y2 - final_y

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
                final_h < int(w * 0.55) and
                (
                    has_ocr_overlap or
                    (bubble_bg_ratio >= 0.50 and bubble_stroke_count >= max(1, int(w * 0.003)))
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

    # Floating Text & Bubble Unification
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
                    # Check 2D intersection
                    ix1 = max(curr["x"], nxt["x"])
                    iy1 = max(curr["y"], nxt["y"])
                    ix2 = min(curr["x"] + curr["w"], nxt["x"] + nxt["w"])
                    iy2 = min(curr["y"] + curr["h"], nxt["y"] + nxt["h"])

                    inter_w = max(0, ix2 - ix1)
                    inter_h = max(0, iy2 - iy1)
                    inter_area = inter_w * inter_h
                    min_area = min(curr["w"] * curr["h"], nxt["w"] * nxt["h"])

                    # ONLY merge if they are true duplicate candidate boxes (>= 75% 2D area overlap)
                    if min_area > 0 and (inter_area / float(min_area)) >= 0.75:
                        merged_x1 = min(curr["x"], nxt["x"])
                        merged_y1 = min(curr["y"], nxt["y"])
                        merged_x2 = max(curr["x"] + curr["w"], nxt["x"] + nxt["w"])
                        merged_y2 = max(curr["y"] + curr["h"], nxt["y"] + nxt["h"])

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


# Backward-compatible alias
_detect_panels_webtoon = detect_vertical_strip_panels


def _sort_panels_reading_order(panels: List[Dict[str, Any]], reading_order: str = "ltr") -> List[Dict[str, Any]]:
    """
    Sorts comic & webtoon panels into true 2D visual reading order.
    """
    if not panels:
        return panels

    sorted_by_y = sorted(panels, key=lambda b: (b.get("y") or 0, b.get("x") or 0))
    rows: List[List[Dict[str, Any]]] = []

    for panel in sorted_by_y:
        py = float(panel.get("y") or 0)
        ph = float(panel.get("height") or panel.get("h") or 0)

        placed = False
        for row in rows:
            row_y_min = min(float(p.get("y") or 0) for p in row)
            row_y_max = max(float(p.get("y") or 0) for p in row)
            row_avg_h = sum(float(p.get("h") or p.get("height") or 0) for p in row) / float(len(row))
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
        sorted_row = sorted(row, key=lambda b: -(b.get("x") or 0) if is_rtl else (b.get("x") or 0))
        ordered_panels.extend(sorted_row)

    return ordered_panels


def _subdivide_continuous_tall_art_panel(
    sub_gray: np.ndarray,
    bx: int,
    by: int,
    bw: int,
    bh: int,
    child_ocr: List[Dict[str, Any]],
    target_card_h: int = 650
) -> List[Dict[str, Any]]:
    """
    Scans continuous artwork scenes for natural visual scene transitions.
    Avoids hardcoded mathematical grid cuts and strictly protects speech bubbles and character artwork.
    """
    min_split_h = max(60, int(bw * 1.1))
    if bh <= min_split_h:
        return [{"x": 0, "y": 0, "w": bw, "h": bh}]

    if len(sub_gray.shape) == 3:
        if HAS_CV and cv2 is not None:
            sub_gray = cv2.cvtColor(sub_gray, cv2.COLOR_BGR2GRAY)
        else:
            sub_gray = sub_gray[:, :, 0]

    h, w = sub_gray.shape[:2]

    if HAS_CV and cv2 is not None:
        sobel_y = cv2.Sobel(sub_gray, cv2.CV_64F, 0, 1, ksize=3)
        row_border_strength = np.mean(np.abs(sobel_y), axis=1)
    else:
        row_border_strength = np.mean(np.abs(np.diff(sub_gray.astype(float), axis=0)), axis=1)
        row_border_strength = np.append(row_border_strength, 0.0)

    row_stds = np.std(sub_gray, axis=1) if sub_gray.size > 0 else np.zeros(h)
    row_diff_x = np.abs(np.diff(sub_gray.astype(float), axis=1)) if w > 1 else np.zeros((h, 1))
    row_stroke_density = np.mean(row_diff_x > 15.0, axis=1) if row_diff_x.size > 0 else np.zeros(h)

    row_medians = np.median(sub_gray, axis=1) if sub_gray.size > 0 else np.zeros(h)
    
    # Forbidden Cut Zone Mask
    forbidden_mask = np.zeros(h, dtype=bool)
    min_edge_margin = max(6, int(bw * 0.08))
    forbidden_mask[:min_edge_margin] = True
    forbidden_mask[-min_edge_margin:] = True

    if child_ocr:
        ocr_pad = max(4, int(bw * 0.02))
        for b in child_ocr:
            by1 = max(0, int(b.get("y", 0)) - ocr_pad)
            by2 = min(h, int(b.get("y", 0)) + int(b.get("h", 0)) + ocr_pad)
            if by2 > by1:
                forbidden_mask[by1:by2] = True

    artwork_mask = (row_stds > 22.0) | (row_stroke_density > 0.05)
    forbidden_mask = forbidden_mask | artwork_mask

    min_subpanel_h = max(40, int(bw * 0.50))
    cut_y_list = [0]

    curr_y = 0
    while curr_y + min_subpanel_h < h - min_edge_margin:
        search_start = curr_y + min_subpanel_h
        search_end = min(h - min_edge_margin, curr_y + int(bw * 3.5))

        if search_end <= search_start:
            break

        valid_rows = [y for y in range(search_start, search_end) if not forbidden_mask[y]]

        if not valid_rows:
            curr_y += int(min_subpanel_h * 0.5)
            continue

        best_y = min(valid_rows, key=lambda y: (row_stds[y] * 0.6) + (row_stroke_density[y] * 100.0) - (0.2 * row_border_strength[y]))

        has_flat_gutter = row_stds[best_y] <= 18.0 and row_stroke_density[best_y] <= 0.03
        has_clear_border = row_border_strength[best_y] >= 8.0 and row_stds[best_y] <= 22.0

        if has_flat_gutter or has_clear_border:
            cut_y_list.append(best_y)
            curr_y = best_y
        else:
            curr_y += int(min_subpanel_h * 0.5)

    cut_y_list.append(h)

    final_cuts = [0]
    for cy in cut_y_list[1:]:
        if cy - final_cuts[-1] >= min_subpanel_h:
            final_cuts.append(cy)
        else:
            if cy == h and len(final_cuts) > 1:
                final_cuts[-1] = h

    if final_cuts[-1] < h:
        final_cuts.append(h)

    subdivided_boxes = []
    min_box_h = max(10, int(bw * 0.10))
    for k in range(len(final_cuts) - 1):
        sy1 = final_cuts[k]
        sy2 = final_cuts[k + 1]
        sh = sy2 - sy1
        if sh >= min_box_h:
            subdivided_boxes.append({
                "x": 0,
                "y": sy1,
                "w": bw,
                "h": sh
            })

    return subdivided_boxes if subdivided_boxes else [{"x": 0, "y": 0, "w": bw, "h": bh}]


def trim_solid_borders(
    gray_arr: np.ndarray,
    x: int,
    y: int,
    w: int,
    h: int,
    bg_mode: str = "auto",
    tolerance: int = 15
) -> Tuple[int, int, int, int]:
    """
    Trims solid background color borders from an image bounding box.
    """
    if gray_arr is None or w <= 0 or h <= 0:
        return x, y, w, h

    sub = gray_arr[y : y + h, x : x + w]
    if sub.size == 0:
        return x, y, w, h

    is_white = (np.median(sub) > 127) if bg_mode == "auto" else (bg_mode == "white")
    target_val = 255 if is_white else 0

    diff = np.abs(sub.astype(int) - target_val)
    content_mask = diff > tolerance

    if not np.any(content_mask):
        return x, y, w, h

    rows = np.any(content_mask, axis=1)
    cols = np.any(content_mask, axis=0)

    y_indices = np.where(rows)[0]
    x_indices = np.where(cols)[0]

    if len(y_indices) == 0 or len(x_indices) == 0:
        return x, y, w, h

    new_y = y + int(y_indices[0])
    new_h = int(y_indices[-1] - y_indices[0] + 1)
    new_x = x + int(x_indices[0])
    new_w = int(x_indices[-1] - x_indices[0] + 1)

    return new_x, new_y, new_w, new_h


def run_cv_detection(
    image_path: str,
    sensitivity: float = 30.0,
    bg_mode: str = "auto",
    min_width_pct: float = 0.15,
    min_height_px: int = 60,
    merge_threshold: int = 20,
    aspect_ratio_str: str = "free",
    auto_split: bool = True,
    use_yolo: bool = True,
    **kwargs: Any
) -> List[Dict[str, Any]]:
    """
    Modular execution delegator for OpenCV and Webtoon panel detection.
    """
    if not os.path.exists(image_path):
        return []

    try:
        pil_img = Image.open(image_path).convert("L")
        gray_arr = np.array(pil_img)
        img_w, img_h = pil_img.size
    except Exception as e:
        logger.error(f"Failed to load image for detection {image_path}: {e}")
        return []

    is_tall = img_h > img_w * 2.2

    if is_tall and auto_split:
        bg_res = _detect_bg_color_and_threshold(gray_arr, bg_mode, sensitivity)
        is_white_bg, threshold_val, median_bg, bg_std, top_med, bot_med, bg_rgb = bg_res

        res = detect_vertical_strip_panels(
            gray_arr=gray_arr,
            is_white_bg=is_white_bg,
            threshold_val=threshold_val,
            min_height_px=min_height_px,
            min_width_pct=min_width_pct,
            ocr_boxes=[],
            median_bg=median_bg,
            sensitivity=sensitivity,
            top_median=top_med,
            bottom_median=bot_med
        )
        panels = res.panels if hasattr(res, "panels") else (res[0] if isinstance(res, tuple) else [])
        return panels
    else:
        grid_panels = detect_manga_grid_panels(gray_arr, min_width_pct=min_width_pct, min_height_px=min_height_px)
        if grid_panels and len(grid_panels) > 1:
            return grid_panels

        with open(image_path, "rb") as f:
            raw_bytes = f.read()
        cv_res = detect_opencv_boxes(raw_bytes, min_width_pct=min_width_pct, min_height_px=min_height_px)
        return cv_res.get("panels", [])


detect_panels_in_image = run_cv_detection
_split_oversized_webtoon_boxes = _subdivide_continuous_tall_art_panel


# ─── Post-Processing & Overlap Resolution ─────────────────────────────────────

def _normalize_box(box: Dict[str, Any]) -> Dict[str, Any]:
    x = box.get("x")
    if x is None:
        x = box.get("left", 0)
    y = box.get("y")
    if y is None:
        y = box.get("top", 0)
    width = box.get("w")
    if width is None:
        width = box.get("width", 0)
    height = box.get("h")
    if height is None:
        height = box.get("height", 0)

    return {
        **box,
        "x": int(max(0, int(x or 0))),
        "y": int(max(0, int(y or 0))),
        "w": max(1, int(width or 1)),
        "h": max(1, int(height or 1)),
        "confidence": float(box.get("confidence", 0.90) or 0.90),
        "lineage": list(box.get("lineage", [box.get("id", "0")])),
        "bubble_candidate": bool(box.get("bubble_candidate", False)),
        "top_removed_px": int(box.get("top_removed_px", 0) or 0),
        "bottom_removed_px": int(box.get("bottom_removed_px", 0) or 0),
    }


def resolve_overlapping_panels_lineage(
    boxes: List[Dict[str, Any]],
    orig_w: int = 800,
    orig_h: int = 1200,
    iou_thresh: float = 0.40
) -> List[Dict[str, Any]]:
    """Deduplicates overlapping candidate panels (IoU > 0.40) using lineage first, then confidence."""
    if not boxes or len(boxes) <= 1:
        return boxes

    normalized_boxes = [_normalize_box(b) for b in boxes]
    sorted_boxes = sorted(normalized_boxes, key=lambda b: (b.get("y", 0) or 0, b.get("x", 0) or 0))
    kept: List[Dict[str, Any]] = []

    for cand in sorted_boxes:
        cx1: int = int(cand.get("x", 0) or 0)
        cy1: int = int(cand.get("y", 0) or 0)
        cw: int = max(1, int(cand.get("w", 0) or cand.get("width", 0) or 1))
        ch: int = max(1, int(cand.get("h", 0) or cand.get("height", 0) or 1))
        cx2: int = cx1 + cw
        cy2: int = cy1 + ch
        c_lineage = set(cand.get("lineage", []))
        c_conf: float = float(cand.get("confidence", 0.90) or 0.90)

        duplicate = False
        for k in kept:
            kx1: int = int(k.get("x", 0) or 0)
            ky1: int = int(k.get("y", 0) or 0)
            kw: int = max(1, int(k.get("w", 0) or k.get("width", 0) or 1))
            kh: int = max(1, int(k.get("h", 0) or k.get("height", 0) or 1))
            kx2: int = kx1 + kw
            ky2: int = ky1 + kh

            inter_x1 = max(cx1, kx1)
            inter_x2 = min(cx2, kx2)
            inter_y1 = max(cy1, ky1)
            inter_y2 = min(cy2, ky2)

            inter_w = max(0, inter_x2 - inter_x1)
            inter_h = max(0, inter_y2 - inter_y1)
            inter_area = inter_w * inter_h

            if inter_area > 0:
                min_area = min(cw * ch, kw * kh)
                union_area = (cw * ch) + (kw * kh) - inter_area
                iou = inter_area / float(max(1, union_area))
                overlap_min = inter_area / float(max(1, min_area))
                
                # Only deduplicate true duplicate boxes (>= 75% 2D IoU), never merge vertically stacked separate panels
                if iou >= 0.75 or overlap_min >= 0.85:
                    k_lineage = set(k.get("lineage", []))
                    k_conf: float = float(k.get("confidence", 0.90) or 0.90)

                    if c_lineage and k_lineage and bool(c_lineage & k_lineage):
                        new_x = min(kx1, cx1)
                        k["x"] = new_x
                        k["w"] = max(kx2, cx2) - new_x
                        k["y"] = min(ky1, cy1)
                        k["h"] = max(ky2, cy2) - k["y"]
                        duplicate = True
                        break

                    if abs(c_conf - k_conf) >= 0.20:
                        if c_conf > k_conf:
                            k.update(cand)
                        duplicate = True
                        break
                    else:
                        new_x = min(kx1, cx1)
                        k["x"] = new_x
                        k["w"] = max(kx2, cx2) - new_x
                        k["y"] = min(ky1, cy1)
                        k["h"] = max(ky2, cy2) - k["y"]
                        duplicate = True
                        break

        if not duplicate:
            kept.append(cand)

    return kept


def resolve_micro_panels(
    boxes: List[Dict[str, Any]],
    gray_arr: Optional[np.ndarray] = None,
    img_h: int = 1200
) -> List[Dict[str, Any]]:
    """Filters out noise/micro slices below scale limit unless containing speech bubbles."""
    if not boxes:
        return boxes
    min_limit = max(10, int(img_h * 0.005)) if img_h else 10
    cleaned = []
    for b in boxes:
        h = int(b.get("h", 0) or b.get("height", 0) or 0)
        has_bubble = b.get("has_bound_bubbles") or b.get("bubble_candidate") or (len(b.get("speech_bubbles", [])) > 0)
        if h >= min_limit or has_bubble:
            cleaned.append(b)
    return cleaned if cleaned else boxes


def compute_post_panel_confidence(
    box: Dict[str, Any],
    gray_arr: Optional[np.ndarray] = None,
    sep_score_above: float = 0.85,
    sep_score_below: float = 0.85,
) -> float:
    return float(np.clip(float(box.get("confidence", 0.95)), 0.50, 0.99))


postprocess_panel_boundaries = compute_post_panel_confidence
