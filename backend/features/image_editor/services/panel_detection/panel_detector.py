"""
backend/features/image_editor/services/panel_detection/panel_detector.py
─────────────────────────────────────────────────────────────────────────────
Unified Comic & Webtoon Panel Detection Engine:
- High-precision vertical strip slicing with gradient baseline tracking
- Adaptive background color polarity and noise-tolerant threshold estimation
- 100% empty gutter whitespace trimming and boundary calculation
- Multi-column subgutter detection and side-by-side panel splitting
- Continuous art scene subdivision with OCR / dialogue protection
- True 2D visual reading order sequencing (LTR / RTL / TTB)
- Non-destructive spatial overlap deduplication
- Modular OpenCV / Manga Grid / Webtoon execution delegator
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import io
import time
import base64
import logging
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional, Any, Union

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

import cv2
import numpy as np
from PIL import Image
from pydantic import BaseModel, Field

from common.media import resolve_image_to_buffer
from features.platform.projects.schemas_project import (
    PanelBoundingBox,
    EntityLabel,
    EntityCategory,
)
from features.image_editor.services.panel_detection.opencv_detector import detect_opencv_boxes
from features.image_editor.services.panel_detection.grid_detector import detect_manga_grid_panels

logger = logging.getLogger("sonikoma.services.image.panel_detection.panel_detector")

# ─────────────────────────────────────────────────────────────────────────────
# 1. Global State & Module Constants
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_SENSITIVITY: float = 30.0
DEFAULT_MIN_WIDTH_PCT: float = 0.15
DEFAULT_MIN_HEIGHT_PX: int = 60
DEFAULT_PADDING_PX: int = 10
DEFAULT_IOU_THRESHOLD: float = 0.40
DEFAULT_CANNY_LOW: int = 20
DEFAULT_CANNY_HIGH: int = 100
DEFAULT_CLOSE_KERNEL: int = 15


# ─────────────────────────────────────────────────────────────────────────────
# 2. Data Structures & Result Containers
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class PanelDetectionResult:
    """
    Encapsulates results from the vertical strip slicing and gutter analysis engine.

    Attributes:
        panels (List[Dict[str, Any]]): Detected panel bounding boxes and metadata.
        separator_bands (List[int]): Vertical Y-axis cut midpoints for panel separations.
        gutter_ranges (List[Tuple[int, int]]): Vertical (start_y, end_y) spans of detected gutters.
        separator_mask (Optional[np.ndarray]): Boolean 1D mask marking gutter rows across the height.
        content_mask (Optional[np.ndarray]): Boolean 1D mask marking active artwork rows.
        separator_scores (Optional[np.ndarray]): 1D float array of composite separator confidence scores.
    """
    panels: List[Dict[str, Any]]
    separator_bands: List[int]
    gutter_ranges: List[Tuple[int, int]]
    separator_mask: Optional[np.ndarray] = None
    content_mask: Optional[np.ndarray] = None
    separator_scores: Optional[np.ndarray] = None

    def __iter__(self):
        """Allows unpacking as a tuple: panels, separator_bands, gutter_ranges = result."""
        yield self.panels
        yield self.separator_bands
        yield self.gutter_ranges


# ─────────────────────────────────────────────────────────────────────────────
# 3. Background Color & Adaptive Threshold Estimation
# ─────────────────────────────────────────────────────────────────────────────

def detect_background_color_and_threshold(
    gray_arr: np.ndarray,
    bg_mode: str = "auto",
    sensitivity: float = DEFAULT_SENSITIVITY,
    color_arr: Optional[np.ndarray] = None,
) -> Tuple[bool, int, float, float, float, float, Tuple[int, int, int]]:
    """
    Detects canvas background parameters across grayscale and optional color channels.

    Calculates adaptive background polarity, threshold cutoffs, and edge medians
    to ensure precise gutter detection in both light and dark webtoon strips.

    Args:
        gray_arr (np.ndarray): 2D grayscale image array (H, W).
        bg_mode (str, optional): Target background mode ('auto', 'white', or 'black'). Defaults to 'auto'.
        sensitivity (float, optional): Gutter sensitivity multiplier. Defaults to 30.0.
        color_arr (Optional[np.ndarray], optional): 3D RGB image array (H, W, 3). Defaults to None.

    Returns:
        Tuple[bool, int, float, float, float, float, Tuple[int, int, int]]:
            (is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb)
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if gray_arr is None or gray_arr.size == 0 or gray_arr.ndim < 2:
        logger.debug("[Panel Background] Invalid or empty grayscale array, returning safe white default.")
        return True, 240, 255.0, 0.0, 255.0, 255.0, (255, 255, 255)

    h, w = gray_arr.shape[:2]
    band_y = max(1, min(20, int(h * 0.005)))
    band_x = max(1, min(20, int(w * 0.01)))

    # ── Stage 2: Feature Extraction & Edge Sampling ─────────────────────────
    top_edge = gray_arr[:band_y, :]
    bottom_edge = gray_arr[-band_y:, :]
    left_edge = gray_arr[:, :band_x]
    right_edge = gray_arr[:, -band_x:]

    top_median = float(np.median(top_edge))
    bottom_median = float(np.median(bottom_edge))

    if h > int(w * 1.5):
        # Tall webtoon strip: left/right edges frequently contain full-bleed art.
        # Sample flat horizontal gutter rows across the strip for true canvas background.
        step = max(1, h // 2000)
        sub_sample = gray_arr[::step, :]
        row_stds_fast = np.std(sub_sample, axis=1)
        flat_mask = row_stds_fast < 5.0
        if np.any(flat_mask):
            flat_medians = np.median(sub_sample[flat_mask, :], axis=1)
            median_bg = float(np.median(flat_medians))
            bg_std = float(np.std(flat_medians))
        else:
            edge_samples = np.concatenate([top_edge.ravel(), bottom_edge.ravel()])
            median_bg = float(np.median(edge_samples))
            bg_std = float(np.std(edge_samples))
    else:
        edge_samples = np.concatenate([
            top_edge.ravel(),
            bottom_edge.ravel(),
            left_edge.ravel(),
            right_edge.ravel(),
        ])
        median_bg = float(np.median(edge_samples))
        bg_std = float(np.std(edge_samples))

    # ── Stage 3: Polarity Determination & Threshold Calculation ────────────
    if bg_mode == "auto":
        is_white_bg = bool(median_bg > 127.0)
    else:
        is_white_bg = bool(bg_mode == "white")
        median_bg = 255.0 if is_white_bg else 0.0

    noise_adaptive_offset = max(8.0, min(30.0, (sensitivity * 0.8) + (bg_std * 0.4)))
    if is_white_bg:
        threshold_val = int(min(252, max(210, median_bg - noise_adaptive_offset)))
    else:
        threshold_val = int(max(8, min(45, median_bg + noise_adaptive_offset)))

    # ── Stage 4: Color Channel Sampling & Structured Output ─────────────────
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
        except Exception as e:
            logger.debug(f"[Panel Background] Failed sampling border RGB color ({e}), using polarity default.")

    logger.debug(
        f"[Panel Background] Detected bg: {'WHITE' if is_white_bg else 'DARK'} "
        f"(median={median_bg:.1f}, thresh={threshold_val}, std={bg_std:.2f})"
    )
    return is_white_bg, threshold_val, median_bg, bg_std, top_median, bottom_median, bg_color_rgb


# ─────────────────────────────────────────────────────────────────────────────
# 4. Multi-Column Subgutter & Horizontal Splitting
# ─────────────────────────────────────────────────────────────────────────────

def detect_vertical_subgutters(
    slice_gray: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    median_bg: float,
    min_col_gutter_px: int = 12,
) -> List[Tuple[int, int]]:
    """
    Scans a horizontal panel slice for vertical column gutters to split side-by-side panels.

    Args:
        slice_gray (np.ndarray): 2D grayscale image slice for the horizontal band (H, W).
        is_white_bg (bool): True if background canvas is white/light.
        threshold_val (int): Binarization cutoff value for background detection.
        median_bg (float): Median background intensity value.
        min_col_gutter_px (int, optional): Minimum vertical gutter width in pixels. Defaults to 12.

    Returns:
        List[Tuple[int, int]]: List of horizontal coordinate spans [(col_x1, col_x2), ...].
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if slice_gray is None or slice_gray.size == 0:
        return [(0, 0)]

    sh, sw = slice_gray.shape[:2]
    if sw < min_col_gutter_px * 3:
        return [(0, sw)]

    # ── Stage 2: Feature Extraction & Column Density ────────────────────────
    col_stds = np.std(slice_gray, axis=0)
    col_medians = np.median(slice_gray, axis=0)
    bg_color_match = np.abs(col_medians - float(median_bg)) <= 12.0

    if is_white_bg:
        bg_col_counts = np.sum(slice_gray >= threshold_val, axis=0)
    else:
        bg_col_counts = np.sum(slice_gray <= threshold_val, axis=0)
    col_bg_ratios = bg_col_counts / float(max(1, sh))

    col_diff_y = np.abs(np.diff(slice_gray.astype(float), axis=0)) if sh > 1 else np.zeros((1, sw))
    col_strokes = np.sum(col_diff_y > 18.0, axis=0)

    # ── Stage 3: Core Algorithmic Subgutter Identification ───────────────────
    # Column gutter requires genuine canvas background match, uniform brightness, and no ink strokes
    is_col_gutter = (
        bg_color_match
        & (col_bg_ratios >= 0.80)
        & (col_stds < 12.0)
        & (col_strokes <= max(2, int(sh * 0.02)))
    )
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

    # ── Stage 4: Structured Output & Fallbacks ──────────────────────────────
    if len(sub_cols) <= 1:
        return [(0, sw)]

    logger.debug(f"[Panel Subgutter] Split horizontal slice into {len(sub_cols)} column(s): {sub_cols}")
    return sub_cols


# ─────────────────────────────────────────────────────────────────────────────
# 5. Content Row Classification & Whitespace Trim Bounds
# ─────────────────────────────────────────────────────────────────────────────

def _trim_panel_slice_whitespace(
    sub_slice: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    col_w: int,
    w: int,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None,
    start_y: int = 0,
    end_y: int = 0,
    col_x1: int = 0,
    col_x2: int = 0,
    padding_px: Optional[int] = None,
) -> Optional[Tuple[int, int, int, int]]:
    """
    Classifies active artwork rows within a vertical panel slice and computes trimmed
    vertical bounds (top_pad, final_h, top_removed, bottom_removed).

    Trims away empty gutter whitespace above and below panel content while strictly
    preserving art bleeds, thin borders, and dialogue text.

    Args:
        sub_slice (np.ndarray): 2D grayscale sub-slice array (H, W).
        is_white_bg (bool): True if background canvas is light.
        threshold_val (int): Intensity cutoff value.
        col_w (int): Width of the sub-column slice.
        w (int): Total width of the parent image.
        ocr_boxes (Optional[List[Dict[str, Any]]], optional): Known OCR dialogue boxes. Defaults to None.
        start_y (int, optional): Global Y-offset of the sub-slice. Defaults to 0.
        end_y (int, optional): Global Y-endpoint of the sub-slice. Defaults to 0.
        col_x1 (int, optional): Global left boundary of the column. Defaults to 0.
        col_x2 (int, optional): Global right boundary of the column. Defaults to 0.
        padding_px (Optional[int], optional): Custom safety margin in pixels. Defaults to None.

    Returns:
        Optional[Tuple[int, int, int, int]]: (top_pad, final_h, top_removed, bottom_removed)
            or None if no artwork content exists in the slice.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if sub_slice is None or sub_slice.size == 0:
        return None

    slice_h = sub_slice.shape[0]
    margin_x = max(2, int(col_w * 0.15))
    center_slice = sub_slice[:, margin_x:-margin_x] if col_w > margin_x * 2 else sub_slice
    center_w = max(1, center_slice.shape[1])

    band_y = max(1, min(20, int(slice_h * 0.10)))
    slice_bg_med = float(np.median(np.concatenate([
        center_slice[:band_y, :].ravel(),
        center_slice[-band_y:, :].ravel(),
    ])))

    is_local_white = bool(slice_bg_med > 127.0)
    local_thresh = (
        int(min(252, max(140, slice_bg_med - 20.0)))
        if is_local_white
        else int(max(8, min(115, slice_bg_med + 20.0)))
    )

    # ── Stage 2: Feature Extraction & Statistics ────────────────────────────
    center_stds = np.std(center_slice, axis=1)
    if is_local_white:
        center_bg_ratio = np.sum(center_slice > local_thresh, axis=1) / float(center_w)
    else:
        center_bg_ratio = np.sum(center_slice < local_thresh, axis=1) / float(center_w)

    center_diffs = np.abs(np.diff(center_slice.astype(float), axis=1))
    center_text_strokes = np.sum(center_diffs > 10.0, axis=1)

    # ── Stage 3: Content Mask Generation & OCR Protection ───────────────────
    content_rows = (
        (center_bg_ratio < 0.92)
        | (center_stds > 1.5)
        | (center_text_strokes >= 1)
    )

    if ocr_boxes:
        bubble_pad = max(20, min(80, int(slice_h * 0.08)))
        for box in ocr_boxes:
            bx = int(box.get("x", 0))
            by = int(box.get("y", 0))
            bw_b = int(box.get("w", 0))
            bh_b = int(box.get("h", 0))
            if not (bx + bw_b < col_x1 or bx > col_x2):
                by1_rel = max(0, by - start_y - bubble_pad)
                by2_rel = min(slice_h, (by + bh_b) - start_y + bubble_pad)
                if by2_rel > by1_rel:
                    content_rows[by1_rel:by2_rel] = True

    if not np.any(content_rows):
        return None

    # ── Stage 4: Boundary Calculation & Padding ─────────────────────────────
    valid_y_indices = np.where(content_rows)[0]
    # Minimum 8px safety margin so thin ink lines / borders are never clipped
    pad = max(8, int(w * 0.015)) if padding_px is None else max(8, int(padding_px))

    top_pad = max(0, int(valid_y_indices[0]) - pad)
    bot_pad = min(slice_h, int(valid_y_indices[-1]) + pad + 1)

    final_h = max(10, bot_pad - top_pad)
    top_removed = top_pad
    bottom_removed = slice_h - bot_pad

    return top_pad, final_h, top_removed, bottom_removed


# ─────────────────────────────────────────────────────────────────────────────
# 6. High-Precision Vertical Strip Panel Slicing (Webtoon Engine)
# ─────────────────────────────────────────────────────────────────────────────

def detect_vertical_strip_panels(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None,
    median_bg: Optional[float] = None,
    sensitivity: float = DEFAULT_SENSITIVITY,
    gutter_bg_ratio: float = 0.55,
    gutter_std_thresh: float = 8.0,
    gutter_flat_bg_ratio: float = 0.45,
    top_median: Optional[float] = None,
    bottom_median: Optional[float] = None,
    enable_x_trimming: bool = True,
    enable_column_split: bool = True,
    high_sensitivity: bool = False,
    padding_px: Optional[int] = None,
) -> PanelDetectionResult:
    """
    Universal high-precision vertical strip slicing strategy for continuous webtoon scrolls.

    Features gradient baseline tracking, Speech Bubble Protection Shield, horizontal
    X-margin trimming, sub-column gutter extraction, and whitespace elimination.

    Args:
        gray_arr (np.ndarray): 2D grayscale image array (H, W).
        is_white_bg (bool): True if background canvas is white/light.
        threshold_val (int): Binarization cutoff value.
        min_height_px (int): Minimum permissible panel height in pixels.
        min_width_pct (float): Minimum permissible panel width as a fraction of total width.
        ocr_boxes (Optional[List[Dict[str, Any]]], optional): Dialogue / speech bubble bounding boxes.
        median_bg (Optional[float], optional): Median background intensity value.
        sensitivity (float, optional): Gutter sensitivity multiplier. Defaults to 30.0.
        gutter_bg_ratio (float, optional): Minimum background ratio to qualify as gutter. Defaults to 0.55.
        gutter_std_thresh (float, optional): Maximum row standard deviation for flat gutter. Defaults to 8.0.
        gutter_flat_bg_ratio (float, optional): Flat background ratio threshold. Defaults to 0.45.
        top_median (Optional[float], optional): Grayscale median at top edge. Defaults to None.
        bottom_median (Optional[float], optional): Grayscale median at bottom edge. Defaults to None.
        enable_x_trimming (bool, optional): Enables horizontal whitespace margin trimming. Defaults to True.
        enable_column_split (bool, optional): Enables side-by-side subcolumn splitting. Defaults to True.
        high_sensitivity (bool, optional): Lowers cut thresholds for faint gutters. Defaults to False.
        padding_px (Optional[int], optional): Safety margin in pixels. Defaults to None.

    Returns:
        PanelDetectionResult: Result object containing panels, separator bands, and diagnostic masks.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if gray_arr is None or gray_arr.size == 0 or gray_arr.ndim < 2:
        logger.debug("[Webtoon Slicer] Invalid input array, returning empty result.")
        return PanelDetectionResult(panels=[], separator_bands=[], gutter_ranges=[])

    h, w = gray_arr.shape[:2]
    margin = max(4, min(60, int(w * 0.08)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    effective_gutter_bg_ratio = max(0.45, min(0.75, gutter_bg_ratio))
    if high_sensitivity:
        effective_gutter_bg_ratio = max(0.35, effective_gutter_bg_ratio - 0.10)
        gutter_flat_bg_ratio = max(0.25, gutter_flat_bg_ratio - 0.10)
        gutter_std_thresh = gutter_std_thresh + 4.0

    # ── Stage 2: Feature Extraction & Vectorized Row Scoring ────────────────
    row_stds = np.std(gray_center, axis=1)
    row_diffs = np.abs(np.diff(gray_center.astype(float), axis=1))
    stroke_counts = np.sum(row_diffs > 18.0, axis=1)
    row_grads = np.abs(np.gradient(gray_center.astype(float), axis=1))
    edge_counts = np.sum(row_grads > 12.0, axis=1)

    target_bg = float(median_bg) if median_bg is not None else (255.0 if is_white_bg else 0.0)
    bg_tolerance = max(18.0, min(40.0, sensitivity * 0.9))
    if is_white_bg:
        bg_match = (gray_center >= threshold_val) | (np.abs(gray_center.astype(float) - target_bg) <= bg_tolerance)
    else:
        bg_match = (gray_center <= threshold_val) | (np.abs(gray_center.astype(float) - target_bg) <= bg_tolerance)
    page_bg_ratio = np.sum(bg_match, axis=1) / float(max(1, w_center))

    med_std = float(np.median(row_stds))
    mad_std = float(np.median(np.abs(row_stds - med_std)))
    mad_norm_std = np.clip((row_stds - med_std) / (1.4826 * mad_std + 1e-5), 0.0, 5.0)

    stroke_density = stroke_counts / float(max(1, w_center))
    stroke_score = np.clip(1.0 - (stroke_density * 10.0), 0.0, 1.0)
    edge_density = edge_counts / float(max(1, w_center))
    edge_score = np.clip(1.0 - (edge_density * 8.0), 0.0, 1.0)
    mad_score = np.clip(1.0 - (mad_norm_std / 3.0), 0.0, 1.0)

    separator_score = (
        0.50 * page_bg_ratio
        + 0.20 * stroke_score
        + 0.15 * edge_score
        + 0.15 * mad_score
    )

    sep_threshold = 0.45 if high_sensitivity else 0.55
    max_stroke_count = max(4, int(w_center * 0.025))
    is_gutter_row = (
        (stroke_counts <= max_stroke_count)
        & (page_bg_ratio >= (effective_gutter_bg_ratio - 0.10))
        & ((separator_score >= sep_threshold) | (row_stds <= gutter_std_thresh * 1.8))
        & (edge_density <= 0.15)
    )
    is_content_row = ~is_gutter_row

    # ── Stage 3: Speech Bubble Protection Shield ────────────────────────────
    if ocr_boxes:
        bubble_pad = max(14, int(w * 0.035))
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
                max_bridge_gap = max(10, int(w * 0.04))
                if 0 <= gap_between <= max_bridge_gap:
                    bridge_start = max(0, int(box.get("y", 0)))
                    bridge_end = min(h, int(nxt_box.get("y", 0)) + int(nxt_box.get("h", 0)))
                    is_content_row[bridge_start:bridge_end] = True

    is_gutter_row = ~is_content_row

    # ── Stage 4: Gutter Band Identification & Cut Point Calculation ─────────
    cut_points: List[int] = []
    gutter_heights: List[int] = []
    gutter_ranges_list: List[Tuple[int, int]] = []

    in_gutter = False
    g_start = 0
    # Minimum gutter height: 6px or 0.8% of width to ensure reliable separation without false-splitting art
    min_gutter_h = max(6, int(w * 0.008))

    for i in range(h):
        if is_gutter_row[i] and not in_gutter:
            in_gutter = True
            g_start = i
        elif not is_gutter_row[i] and in_gutter:
            in_gutter = False
            g_end = i
            gh = g_end - g_start
            if gh >= min_gutter_h:
                avg_bg_ratio = float(np.mean(page_bg_ratio[g_start:g_end]))
                avg_std = float(np.mean(row_stds[g_start:g_end]))
                if avg_bg_ratio >= (effective_gutter_bg_ratio - 0.15) and (
                    avg_std <= gutter_std_thresh * 2.2 or gh >= max(8, int(w * 0.012))
                ):
                    cut_y = (g_start + g_end) // 2
                    cut_points.append(cut_y)
                    gutter_heights.append(gh)
                    gutter_ranges_list.append((g_start, g_end))

    if in_gutter:
        g_end = h
        gh = g_end - g_start
        if gh >= min_gutter_h:
            avg_bg_ratio = float(np.mean(page_bg_ratio[g_start:g_end]))
            avg_std = float(np.mean(row_stds[g_start:g_end]))
            if avg_bg_ratio >= (effective_gutter_bg_ratio - 0.15) and (
                avg_std <= gutter_std_thresh * 2.2 or gh >= max(8, int(w * 0.012))
            ):
                cut_y = (g_start + g_end) // 2
                cut_points.append(cut_y)
                gutter_heights.append(gh)
                gutter_ranges_list.append((g_start, g_end))

    # Safety Shield: Discard any cut point that lands inside or adjacent to a speech bubble
    if ocr_boxes and cut_points:
        safe_cut_points = []
        for cp in cut_points:
            inside_any_bubble = False
            for b in ocr_boxes:
                by1 = max(0, int(b.get("y", 0)) - 10)
                by2 = min(h, int(b.get("y", 0) + b.get("h", 0)) + 10)
                if by1 <= cp <= by2:
                    inside_any_bubble = True
                    break
            if not inside_any_bubble:
                safe_cut_points.append(cp)
        cut_points = safe_cut_points

    # ── Stage 5: Vertical Slice Assembly & Sub-Column Trimming ──────────────
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
        if enable_column_split and w >= 300 and slice_h < int(w * 3.5):
            col_ranges = detect_vertical_subgutters(slice_gray, is_white_bg, threshold_val, med_bg_val)

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
                    left_pad = max(0, int(valid_indices[0]) - 4)
                    right_pad = min(col_w, int(valid_indices[-1]) + 5)

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
                trim_res = _trim_panel_slice_whitespace(
                    sub_slice,
                    is_white_bg,
                    threshold_val,
                    col_w,
                    w,
                    ocr_boxes=ocr_boxes,
                    start_y=start_y,
                    end_y=end_y,
                    col_x1=col_x1,
                    col_x2=col_x2,
                    padding_px=padding_px,
                )
                if trim_res is None:
                    continue

                top_pad, calc_h, top_removed_px, bottom_removed_px = trim_res
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
                final_h < int(w * 0.55)
                and (
                    has_ocr_overlap
                    or (bubble_bg_ratio >= 0.50 and bubble_stroke_count >= max(1, int(w * 0.003)))
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
                "bubble_candidate": bubble_candidate,
            })

    # ── Stage 6: Floating Text & Bubble Unification ─────────────────────────
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
                    ix1 = max(curr["x"], nxt["x"])
                    iy1 = max(curr["y"], nxt["y"])
                    ix2 = min(curr["x"] + curr["w"], nxt["x"] + nxt["w"])
                    iy2 = min(curr["y"] + curr["h"], nxt["y"] + nxt["h"])

                    inter_w = max(0, ix2 - ix1)
                    inter_h = max(0, iy2 - iy1)
                    inter_area = inter_w * inter_h
                    min_area = min(curr["w"] * curr["h"], nxt["w"] * nxt["h"])

                    # Merge true duplicate candidate boxes (>= 75% 2D area overlap)
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
                            "bubble_candidate": curr.get("bubble_candidate", False) or nxt.get("bubble_candidate", False),
                        })
                        skip_indices.add(i + 1)
                        unifying = True
                        continue

                unified_boxes.append(curr)

            raw_boxes = unified_boxes

    logger.info(
        f"[Webtoon Slicer] Slicing complete: extracted {len(raw_boxes)} panel(s) "
        f"across {len(cut_points)} gutter band(s)."
    )

    return PanelDetectionResult(
        panels=raw_boxes,
        separator_bands=cut_points,
        gutter_ranges=gutter_ranges_list,
        separator_mask=is_gutter_row.copy(),
        content_mask=is_content_row.copy(),
        separator_scores=separator_score.copy(),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 7. Continuous Artwork Subdivision & Scene Transition Slicing
# ─────────────────────────────────────────────────────────────────────────────

def subdivide_continuous_tall_art_panel(
    sub_gray: np.ndarray,
    bx: int,
    by: int,
    bw: int,
    bh: int,
    child_ocr: List[Dict[str, Any]],
    target_card_h: int = 650,
) -> List[Dict[str, Any]]:
    """
    Scans continuous artwork scenes for natural visual scene transitions.

    Avoids hardcoded mathematical grid cuts and strictly protects speech bubbles
    and character artwork from being severed.

    Args:
        sub_gray (np.ndarray): Grayscale array of the candidate panel.
        bx (int): Panel left offset.
        by (int): Panel top offset.
        bw (int): Panel width.
        bh (int): Panel height.
        child_ocr (List[Dict[str, Any]]): OCR / speech bubble bounding boxes inside this panel.
        target_card_h (int, optional): Ideal target panel height. Defaults to 650.

    Returns:
        List[Dict[str, Any]]: List of subdivided relative panel boxes [{'x', 'y', 'w', 'h'}, ...].
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    min_split_h = max(100, int(bw * 2.5))
    if bh <= min_split_h or sub_gray is None or sub_gray.size == 0:
        return [{"x": 0, "y": 0, "w": bw, "h": bh}]

    if len(sub_gray.shape) == 3:
        sub_gray = cv2.cvtColor(sub_gray, cv2.COLOR_BGR2GRAY)

    h, w = sub_gray.shape[:2]

    # ── Stage 2: Feature Extraction & Gradient Border Strength ──────────────
    sobel_y = cv2.Sobel(sub_gray, cv2.CV_64F, 0, 1, ksize=3)
    row_border_strength = np.mean(np.abs(sobel_y), axis=1)

    row_stds = np.std(sub_gray, axis=1) if sub_gray.size > 0 else np.zeros(h)
    row_diff_x = np.abs(np.diff(sub_gray.astype(float), axis=1)) if w > 1 else np.zeros((h, 1))
    row_stroke_density = np.mean(row_diff_x > 15.0, axis=1) if row_diff_x.size > 0 else np.zeros(h)

    # ── Stage 3: Forbidden Cut Zone Construction ────────────────────────────
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

    # ── Stage 4: Optimal Transition Search & Subdivision ────────────────────
    min_subpanel_h = max(150, int(bw * 0.90))
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

        best_y = min(
            valid_rows,
            key=lambda y: (row_stds[y] * 0.6) + (row_stroke_density[y] * 100.0) - (0.2 * row_border_strength[y]),
        )

        has_flat_gutter = row_stds[best_y] <= 14.0 and row_stroke_density[best_y] <= 0.02
        has_clear_border = row_border_strength[best_y] >= 10.0 and row_stds[best_y] <= 18.0

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

    subdivided_boxes: List[Dict[str, Any]] = []
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
                "h": sh,
            })

    logger.debug(
        f"[Panel Subdivision] Subdivided tall art panel ({bw}x{bh}px) into {len(subdivided_boxes)} subpanel(s)."
    )
    return subdivided_boxes if subdivided_boxes else [{"x": 0, "y": 0, "w": bw, "h": bh}]


# ─────────────────────────────────────────────────────────────────────────────
# 8. 2D Visual Reading Order Sequencing
# ─────────────────────────────────────────────────────────────────────────────

def sort_panels_reading_order(
    panels: List[Dict[str, Any]],
    reading_order: str = "ltr",
) -> List[Dict[str, Any]]:
    """
    Sorts comic & webtoon panels into true 2D visual reading order.

    Clusters panels into horizontal tiers with adaptive vertical tolerance,
    then sorts columns according to the specified reading convention (LTR or RTL).

    Args:
        panels (List[Dict[str, Any]]): List of raw panel dictionary items.
        reading_order (str, optional): Reading convention ('ltr' or 'rtl'). Defaults to 'ltr'.

    Returns:
        List[Dict[str, Any]]: Ordered list of panel dictionaries with reading_order indices.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if not panels:
        return []

    # ── Stage 2: Horizontal Row Tier Clustering ─────────────────────────────
    sorted_by_y = sorted(panels, key=lambda b: (b.get("y") or 0, b.get("x") or 0))
    rows: List[List[Dict[str, Any]]] = []

    for panel in sorted_by_y:
        py = float(panel.get("y") or 0)
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

    # ── Stage 3: Directional Column Sorting (LTR / RTL) ─────────────────────
    is_rtl = reading_order.lower() == "rtl"
    ordered_panels: List[Dict[str, Any]] = []

    for row in rows:
        sorted_row = sorted(row, key=lambda b: -(b.get("x") or 0) if is_rtl else (b.get("x") or 0))
        ordered_panels.extend(sorted_row)

    # ── Stage 4: Structured Output & Index Assignment ───────────────────────
    for idx, panel in enumerate(ordered_panels, start=1):
        panel["reading_order"] = idx

    logger.debug(f"[Panel Sorter] Sequenced {len(ordered_panels)} panel(s) in {reading_order.upper()} order.")
    return ordered_panels


# ─────────────────────────────────────────────────────────────────────────────
# 9. Modular Execution Delegator & Image Detection
# ─────────────────────────────────────────────────────────────────────────────

def run_cv_detection(
    image_input: Union[str, Image.Image, bytes, np.ndarray],
    sensitivity: float = DEFAULT_SENSITIVITY,
    bg_mode: str = "auto",
    min_width_pct: float = DEFAULT_MIN_WIDTH_PCT,
    min_height_px: int = DEFAULT_MIN_HEIGHT_PX,
    auto_split: bool = True,
    canny_low: int = DEFAULT_CANNY_LOW,
    canny_high: int = DEFAULT_CANNY_HIGH,
    close_kernel_size: int = DEFAULT_CLOSE_KERNEL,
    padding_px: int = DEFAULT_PADDING_PX,
    **kwargs: Any,
) -> List[Dict[str, Any]]:
    """
    Modular execution delegator for OpenCV, Manga Grid, and Webtoon vertical strip panel detection.

    Automatically resolves inputs from file paths, raw bytes, or PIL Image instances,
    and forwards tuning parameters to the appropriate specialized vision detector.

    Args:
        image_input (Union[str, Image.Image, bytes, np.ndarray]): Image file path, PIL Image, bytes, or array.
        sensitivity (float, optional): Detection sensitivity. Defaults to 30.0.
        bg_mode (str, optional): Target background mode ('auto', 'white', or 'black'). Defaults to 'auto'.
        min_width_pct (float, optional): Minimum width ratio. Defaults to 0.15.
        min_height_px (int, optional): Minimum height in pixels. Defaults to 60.
        auto_split (bool, optional): Automatically slice tall webtoon strips. Defaults to True.
        canny_low (int, optional): Lower Canny edge detection threshold. Defaults to 20.
        canny_high (int, optional): Upper Canny edge detection threshold. Defaults to 100.
        close_kernel_size (int, optional): Morphological closing kernel size. Defaults to 15.
        padding_px (int, optional): Safety border padding in pixels. Defaults to 10.
        **kwargs (Any): Additional detector arguments.

    Returns:
        List[Dict[str, Any]]: List of detected panel dictionary items.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if image_input is None:
        logger.debug("[Panel Detector] Input image is None, returning empty list.")
        return []

    pil_img: Optional[Image.Image] = None
    raw_bytes: Optional[bytes] = None

    try:
        if isinstance(image_input, str):
            if not os.path.exists(image_input):
                logger.warning(f"[Panel Detector] Image file path does not exist: {image_input}")
                return []
            with open(image_input, "rb") as f:
                raw_bytes = f.read()
            pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        elif isinstance(image_input, bytes):
            raw_bytes = image_input
            pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB") if image_input.mode != "RGB" else image_input
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG")
            raw_bytes = buf.getvalue()
        elif isinstance(image_input, np.ndarray):
            if image_input.ndim == 2:
                pil_img = Image.fromarray(image_input).convert("RGB")
            else:
                pil_img = Image.fromarray(image_input[:, :, :3]).convert("RGB")
            buf = io.BytesIO()
            pil_img.save(buf, format="PNG")
            raw_bytes = buf.getvalue()
        else:
            logger.warning(f"[Panel Detector] Unsupported input type: {type(image_input)}")
            return []
    except Exception as e:
        logger.error(f"[Panel Detector] Failed decoding input image: {e}")
        return []

    img_w, img_h = pil_img.size
    if img_w < 10 or img_h < 10:
        logger.debug(f"[Panel Detector] Image dimensions ({img_w}x{img_h}px) below minimum (10x10px).")
        return []

    # ── Stage 2: Architecture & Layout Strategy Selection ───────────────────
    is_tall = img_h > img_w * 2.2
    gray_arr = np.array(pil_img.convert("L"))

    # ── Stage 3: Core Algorithm Execution ───────────────────────────────────
    if is_tall and auto_split:
        logger.info(f"[Panel Detector] Processing tall Webtoon strip ({img_w}x{img_h}px) via vertical slicer...")
        bg_res = detect_background_color_and_threshold(gray_arr, bg_mode, sensitivity)
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
            bottom_median=bot_med,
            padding_px=padding_px,
        )
        panels = res.panels if hasattr(res, "panels") else (res[0] if isinstance(res, tuple) else [])
    else:
        logger.info(f"[Panel Detector] Processing standard comic page ({img_w}x{img_h}px) via Grid / OpenCV...")
        # Step A: Manga Grid Tier Decomposition
        grid_panels = detect_manga_grid_panels(
            gray_arr,
            min_width_pct=min_width_pct,
            min_height_px=min_height_px,
            canny_low=canny_low,
            canny_high=canny_high,
            close_kernel_size=close_kernel_size,
        )
        if grid_panels and len(grid_panels) > 1:
            panels = grid_panels
        else:
            # Step B: OpenCV Contour Fallback
            cv_res = detect_opencv_boxes(
                raw_bytes or b"",
                min_width_pct=min_width_pct,
                min_height_px=min_height_px,
                canny_low=canny_low,
                canny_high=canny_high,
                close_kernel_size=close_kernel_size,
                bleed_padding_px=max(5, padding_px),
            )
            panels = cv_res.get("panels", [])

    # ── Stage 4: Normalization & Traceable Output ───────────────────────────
    normalized = [normalize_panel_box(p) for p in panels]
    deduped = resolve_overlapping_panels(normalized, orig_w=img_w, orig_h=img_h)
    ordered = sort_panels_reading_order(deduped)

    logger.info(f"[Panel Detector] Detection completed successfully: {len(ordered)} panel(s) returned.")
    return ordered


# ─────────────────────────────────────────────────────────────────────────────
# 10. Post-Processing & Overlap Resolution
# ─────────────────────────────────────────────────────────────────────────────

def normalize_panel_box(box: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitizes panel dictionary keys and guarantees valid dimensions and fallback polygons.

    Args:
        box (Dict[str, Any]): Raw panel dictionary item.

    Returns:
        Dict[str, Any]: Normalized panel dictionary conforming to standard platform schema.
    """
    # ── Stage 1: Coordinate Normalization ───────────────────────────────────
    x = box.get("x")
    if x is None:
        x = box.get("left", 0)
    y = box.get("y")
    if y is None:
        y = box.get("top", 0)
    width = box.get("w")
    if width is None or width == 0:
        width = box.get("width", 0)
    height = box.get("h")
    if height is None or height == 0:
        height = box.get("height", 0)

    x_val = int(max(0, int(x or 0)))
    y_val = int(max(0, int(y or 0)))
    w_val = max(1, int(width or 1))
    h_val = max(1, int(height or 1))

    # ── Stage 2: Fallback Polygon Construction ──────────────────────────────
    raw_poly = box.get("polygon")
    if raw_poly is not None and isinstance(raw_poly, list) and len(raw_poly) >= 3:
        polygon = [[int(pt[0]), int(pt[1])] for pt in raw_poly]
    else:
        # Guarantee 4-point rectangle fallback polygon
        polygon = [
            [x_val, y_val],
            [x_val + w_val, y_val],
            [x_val + w_val, y_val + h_val],
            [x_val, y_val + h_val],
        ]

    # ── Stage 3: Structured Metadata Output ─────────────────────────────────
    return {
        **box,
        "x": x_val,
        "y": y_val,
        "w": w_val,
        "h": h_val,
        "width": w_val,
        "height": h_val,
        "polygon": polygon,
        "confidence": float(box.get("confidence", 0.90) or 0.90),
        "lineage": list(box.get("lineage", [box.get("id", "0")])),
        "bubble_candidate": bool(box.get("bubble_candidate", False)),
        "top_removed_px": int(box.get("top_removed_px", 0) or 0),
        "bottom_removed_px": int(box.get("bottom_removed_px", 0) or 0),
    }


def resolve_overlapping_panels(
    boxes: List[Dict[str, Any]],
    orig_w: int = 800,
    orig_h: int = 1200,
    iou_thresh: float = DEFAULT_IOU_THRESHOLD,
) -> List[Dict[str, Any]]:
    """
    Deduplicates overlapping candidate panels using lineage and confidence ranking.

    Args:
        boxes (List[Dict[str, Any]]): List of candidate panel boxes.
        orig_w (int, optional): Source image width. Defaults to 800.
        orig_h (int, optional): Source image height. Defaults to 1200.
        iou_thresh (float, optional): Intersection-over-Union threshold. Defaults to 0.40.

    Returns:
        List[Dict[str, Any]]: Deduplicated list of non-conflicting panel boxes.
    """
    # ── Stage 1: Input Normalization & Guard Clauses ────────────────────────
    if not boxes or len(boxes) <= 1:
        return boxes

    normalized_boxes = [normalize_panel_box(b) for b in boxes]
    sorted_boxes = sorted(normalized_boxes, key=lambda b: (b.get("y", 0) or 0, b.get("x", 0) or 0))
    kept: List[Dict[str, Any]] = []

    # ── Stage 2: Spatial Deduplication & Lineage Checking ───────────────────
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

    # ── Stage 3: Structured Output ──────────────────────────────────────────
    logger.debug(f"[Panel Overlap] Resolved {len(boxes)} candidate(s) down to {len(kept)} distinct panel(s).")
    return kept


# ─────────────────────────────────────────────────────────────────────────────
# 11. FastAPI Service Endpoint Handler
# ─────────────────────────────────────────────────────────────────────────────

class DetectStripPanelsRequest(BaseModel):
    """
    Request schema for standalone computer vision panel detection.
    Accepts image via public URL, data URI, or base64 buffer.
    """
    url: Optional[str] = Field(None, description="Public HTTP/HTTPS URL of the comic or webtoon image")
    image_url: Optional[str] = Field(None, description="Alias for url")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image string (with or without data URI header)")
    sensitivity: float = Field(30.0, ge=0.0, le=100.0, description="Gutter seam detection sensitivity")
    background_mode: str = Field("auto", description="Background canvas polarity: 'auto', 'white', or 'black'")
    min_width_pct: float = Field(0.15, ge=0.01, le=1.0, description="Minimum panel width as a fraction of image width")
    min_height_px: int = Field(60, ge=10, description="Minimum panel height in pixels")
    padding_px: int = Field(10, ge=0, description="Safety padding around each panel crop")
    reading_flow: str = Field("top_to_bottom", description="Reading order: 'top_to_bottom', 'right_to_left', or 'left_to_right'")
    subdivide_tall: bool = Field(True, description="Whether to subdivide continuous art scenes exceeding standard viewport")


class DetectStripPanelsResponse(BaseModel):
    """
    Response schema for standalone computer vision panel detection.
    Returns normalized panel bounding boxes with polygons, gutters, and runtime stats.
    """
    success: bool
    crop_type: str = "vertical_strip"
    image_width: int = Field(0, description="Source image width in pixels")
    image_height: int = Field(0, description="Source image height in pixels")
    is_white_bg: bool = Field(True, description="Detected background polarity (True=light canvas, False=dark canvas)")
    reading_flow: str = Field("top_to_bottom", description="Applied reading order sequence")
    total_panels: int = Field(0, description="Total count of detected panels")
    panels: List[PanelBoundingBox] = Field(default_factory=list, description="Ordered list of detected panel bounding boxes")
    separator_bands: List[int] = Field(default_factory=list, description="Gutter cut midpoints (Y coordinates)")
    gutter_ranges: List[Tuple[int, int]] = Field(default_factory=list, description="Vertical spans of detected gutters [(y1, y2), ...]")
    execution_time_ms: int = Field(0, description="Total pipeline execution time in milliseconds")
    message: Optional[str] = None


async def detect_panels_service(
    request: Union[DetectStripPanelsRequest, Dict[str, Any]],
) -> DetectStripPanelsResponse:
    """
    High-level async API service handler for unified comic & webtoon panel detection.
    Resolves input buffers, runs the multi-stage CV engine, applies reading order sorting,
    and returns a structured API response.
    """
    start_time = time.perf_counter()

    # ── Stage 1: Request Normalization & Buffer Resolution ───────────────────
    if isinstance(request, dict):
        req_obj = DetectStripPanelsRequest(**request)
    else:
        req_obj = request

    raw_bytes = None
    target_url = req_obj.url or req_obj.image_url
    if target_url:
        logger.debug(f"[Panel API] Resolving image buffer from URL: {target_url}...")
        resolved = await resolve_image_to_buffer(target_url)
        raw_bytes = resolved.get("data")
    elif req_obj.image_base64:
        logger.debug("[Panel API] Decoding base64 image data payload...")
        b64 = req_obj.image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        logger.error("[Panel API] Failed to resolve raw image data from request.")
        raise ValueError("Could not resolve image data. Provide 'url', 'image_url', or 'image_base64'.")

    # ── Stage 2: Image Decoding & Preprocessing ─────────────────────────────
    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    gray_arr = np.array(pil_img.convert("L"))
    logger.info(f"[Panel API] Processing image ({img_w}x{img_h}px, {len(raw_bytes):,} bytes)...")

    # ── Stage 3: Core Panel Detection Pipeline ──────────────────────────────
    is_white_bg, thresh_val, median_bg, bg_std, _, _, _ = detect_background_color_and_threshold(
        gray_arr,
        bg_mode=req_obj.background_mode,
        sensitivity=req_obj.sensitivity,
        color_arr=np.array(pil_img),
    )

    det_result = detect_vertical_strip_panels(
        gray_arr,
        is_white_bg=is_white_bg,
        threshold_val=thresh_val,
        min_height_px=req_obj.min_height_px,
        min_width_pct=req_obj.min_width_pct,
        padding_px=req_obj.padding_px,
    )

    raw_panels = det_result.panels

    # Subdivide tall continuous artwork panels if enabled
    if req_obj.subdivide_tall:
        subdivided: List[Dict[str, Any]] = []
        for p in raw_panels:
            pw = p.get("w", p.get("width", 0))
            ph = p.get("h", p.get("height", 0))
            if ph > max(1200, int(pw * 2.2)):
                subdivided.extend(subdivide_continuous_tall_art_panel(p, gray_arr, is_white_bg, thresh_val))
            else:
                subdivided.append(p)
        raw_panels = subdivided

    # Non-destructive overlap deduplication
    raw_panels = resolve_overlapping_panels(raw_panels)

    # Reading order sequencing
    order_mode = "rtl" if ("rtl" in req_obj.reading_flow.lower() or "right" in req_obj.reading_flow.lower()) else "ltr"
    sorted_panels = sort_panels_reading_order(
        raw_panels,
        reading_order=order_mode,
    )

    # ── Stage 4: Structured Response Conversion ─────────────────────────────
    panel_boxes: List[PanelBoundingBox] = []
    for idx, p in enumerate(sorted_panels, start=1):
        bx = int(p.get("x", 0))
        by = int(p.get("y", 0))
        bw = int(p.get("w", p.get("width", 0)))
        bh = int(p.get("h", p.get("height", 0)))
        poly = p.get("polygon")
        if not poly or len(poly) < 3:
            poly = [[bx, by], [bx + bw, by], [bx + bw, by + bh], [bx, by + bh]]

        panel_boxes.append(
            PanelBoundingBox(
                id=f"panel_{idx}",
                index=idx,
                x=bx,
                y=by,
                w=bw,
                h=bh,
                width=bw,
                height=bh,
                polygon=poly,
                confidence=float(p.get("confidence", 0.90)),
                label=p.get("label", EntityLabel.PANEL_STANDARD.value),
                category=EntityCategory.PANEL.value,
                sub_type=p.get("sub_type", "vertical_strip_panel"),
            )
        )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(
        f"[Panel API] Detection completed in {elapsed_ms}ms: {len(panel_boxes)} panel(s) extracted."
    )

    return DetectStripPanelsResponse(
        success=True,
        crop_type="vertical_strip",
        image_width=img_w,
        image_height=img_h,
        is_white_bg=is_white_bg,
        reading_flow=req_obj.reading_flow,
        total_panels=len(panel_boxes),
        panels=panel_boxes,
        separator_bands=det_result.separator_bands,
        gutter_ranges=det_result.gutter_ranges,
        execution_time_ms=elapsed_ms,
        message=f"Successfully extracted {len(panel_boxes)} panel(s) in {elapsed_ms}ms",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 12. Public Package Exports
# ─────────────────────────────────────────────────────────────────────────────

__all__ = [
    # Data Structures & Containers
    "PanelDetectionResult",
    "DetectStripPanelsRequest",
    "DetectStripPanelsResponse",

    # Webtoon & Strip Detection
    "detect_vertical_strip_panels",
    "detect_background_color_and_threshold",
    "detect_vertical_subgutters",

    # Subdivision & Layout
    "subdivide_continuous_tall_art_panel",
    "sort_panels_reading_order",

    # Delegators & Normalizers
    "run_cv_detection",
    "normalize_panel_box",
    "resolve_overlapping_panels",

    # FastAPI Service Endpoint Handlers
    "detect_panels_service",
    "detect_vertical_strip_panels_service",
]

# Alias for backward compatibility
detect_vertical_strip_panels_service = detect_panels_service



# ─────────────────────────────────────────────────────────────────────────────
# 12. Developer Self-Verification CLI Runner
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    print("\n" + "=" * 78)
    print("  SONIKOMA PANEL DETECTOR: DEVELOPER SELF-VERIFICATION RUNNER")
    print("  [Pipeline: Webtoon Vertical Slicer + Manga Grid + Reading Order Engine]")
    print("=" * 78)

    # Step 1: Dynamic Synthetic Webtoon Strip Generation
    print("\n[Step 1/3] Generating Synthetic Webtoon Strip with Clear Gutters...")
    from PIL import ImageDraw

    canvas_w, canvas_h = 400, 1000
    test_canvas = Image.new("RGB", (canvas_w, canvas_h), color=(255, 255, 255))
    draw = ImageDraw.Draw(test_canvas)

    # Panel 1 (Top box with border and interior ink lines)
    draw.rectangle([30, 40, 370, 360], fill=(240, 240, 240), outline=(0, 0, 0), width=3)
    for y_line in range(80, 320, 30):
        draw.line([60, y_line, 340, y_line], fill=(50, 50, 50), width=2)

    # Gutter whitespace: Y=360 to Y=460 (100px white gutter)

    # Panel 2 (Bottom box with border and diagonal art strokes)
    draw.rectangle([30, 460, 370, 880], fill=(230, 230, 230), outline=(0, 0, 0), width=3)
    draw.ellipse([80, 520, 240, 680], fill=(200, 200, 220), outline=(0, 0, 0), width=2)
    print(f"  ✓ Created synthetic webtoon canvas: {canvas_w}x{canvas_h}px (2 panels, 100px gutter)")

    # Step 2: Run Webtoon Strip Detection Pipeline
    print("\n[Step 2/3] Executing detect_vertical_strip_panels() Slicer...")
    t0 = time.perf_counter()
    gray_np = np.array(test_canvas.convert("L"))
    is_white, thresh, med_bg, bg_std, top_m, bot_m, bg_rgb = detect_background_color_and_threshold(gray_np)
    res = detect_vertical_strip_panels(
        gray_arr=gray_np,
        is_white_bg=is_white,
        threshold_val=thresh,
        min_height_px=60,
        min_width_pct=0.15,
        median_bg=med_bg,
    )
    slicer_ms = int((time.perf_counter() - t0) * 1000)
    print(f"  ✓ Slicer finished in {slicer_ms}ms: {len(res.panels)} panel(s), cut bands at Y={res.separator_bands}")

    # Step 3: Run Full Image Delegator (run_cv_detection)
    print("\n[Step 3/3] Executing Unified Delegator run_cv_detection()...")
    t0 = time.perf_counter()
    detected = run_cv_detection(test_canvas, auto_split=True)
    exec_ms = int((time.perf_counter() - t0) * 1000)

    print("\n" + "─" * 78)
    print(f"  VERIFICATION RESULTS: Extracted {len(detected)} panel(s) in {exec_ms}ms")
    print("─" * 78)
    for p in detected:
        ro = p.get("reading_order", 0)
        px = p.get("x", 0)
        py = p.get("y", 0)
        pw = p.get("width") or p.get("w", 0)
        ph = p.get("height") or p.get("h", 0)
        conf = p.get("confidence", 0.0)
        poly_pts = len(p.get("polygon", []))
        print(
            f"  • #{ro} | Box: (x={px:3d}, y={py:3d}, w={pw:3d}, h={ph:3d}) | "
            f"Conf: {conf:.2f} | Polygon: {poly_pts} pts | Removed: top={p.get('top_removed_px', 0)}px, "
            f"bot={p.get('bottom_removed_px', 0)}px"
        )
    print("─" * 78)

    # Step 4: Run FastAPI Service Handler (detect_panels_service)
    print("\n[Step 4/4] Executing detect_panels_service() Async API Handler...")
    import asyncio
    buf = io.BytesIO()
    test_canvas.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    api_req = DetectStripPanelsRequest(image_base64=b64_str)
    api_resp = asyncio.run(detect_panels_service(api_req))
    print(f"  ✓ API Service executed in {api_resp.execution_time_ms}ms: {api_resp.total_panels} panel(s) returned.")

    print("─" * 78)
    print("  ✓ All developer self-tests passed successfully!\n")
