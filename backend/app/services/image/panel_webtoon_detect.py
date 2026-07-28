"""
backend/app/services/image/panel_webtoon_detect.py
─────────────────────────────────────────────────────────────────────────────
Webtoon vertical strip slicing algorithms, background mode color detection,
and column subdivision.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Optional, Any

from services.image.utils.panel_box_utils import protect_slice_x, protect_slice_y

logger = logging.getLogger("sonikoma.services.image.panel_webtoon_detect")


def _detect_bg_color_and_threshold(
    gray_arr: np.ndarray, bg_mode: str, sensitivity: float
) -> Tuple[bool, int, float]:
    """
    Detects if the background is white/light vs. black/dark by sampling edges
    at a 2% inset. Calculates and returns adaptive (is_white_bg, threshold_val, median_bg).
    """
    h, w = gray_arr.shape
    if bg_mode == "auto":
        inset_y = max(1, min(5, int(h * 0.005)))
        inset_x = max(1, min(5, int(w * 0.005)))
        edge_samples = np.concatenate([
            gray_arr[inset_y, :],
            gray_arr[-inset_y - 1, :],
            gray_arr[:, inset_x],
            gray_arr[:, -inset_x - 1]
        ])
        median_bg = float(np.median(edge_samples))
        is_white_bg = bool(median_bg > 127.0)
    else:
        is_white_bg = bg_mode == "white"
        median_bg = 255.0 if is_white_bg else 0.0

    if is_white_bg:
        threshold_val = int(min(250, max(160, median_bg - (sensitivity * 1.8))))
    else:
        threshold_val = int(max(5, min(95, median_bg + (sensitivity * 1.8))))
    return is_white_bg, threshold_val, median_bg


def _detect_panels_webtoon(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None,
    median_bg: Optional[float] = None,
    sensitivity: float = 30.0
) -> List[Dict[str, Any]]:
    """
    High-precision Webtoon gutter slicing strategy for tall strips.
    Identifies horizontal gaps (gutters) containing mostly background pixels or low row variance,
    then constructs full-width horizontal panel boxes with Speech Bubble Protection.
    """
    h, w = gray_arr.shape
    margin = max(4, min(60, int(w * 0.08)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    row_stds = np.std(gray_center, axis=1)

    if median_bg is not None:
        bg_tolerance = max(12.0, min(25.0, sensitivity * 0.6))
        bg_pixel_count = np.sum(np.abs(gray_center.astype(float) - median_bg) <= bg_tolerance, axis=1)
    elif is_white_bg:
        bg_pixel_count = np.sum(gray_center > threshold_val, axis=1)
    else:
        bg_pixel_count = np.sum(gray_center < threshold_val, axis=1)

    bg_ratio = bg_pixel_count / float(max(1, w_center))

    # Gutter rows: Must have high background pixel ratio (>= 55%) or flat row_std with >= 45% background
    is_gutter_row = (bg_ratio >= 0.55) | ((row_stds < 8.0) & (bg_ratio >= 0.45))
    is_content_row = ~is_gutter_row

    # Speech Bubble & OCR Protection: Ensure rows with speech bubbles are treated as content rows
    if ocr_boxes:
        for box in ocr_boxes:
            by1 = max(0, int(box.get("y", 0)) - 8)
            by2 = min(h, int(box.get("y", 0) + box.get("h", 0)) + 8)
            if by2 > by1:
                is_content_row[by1:by2] = True

    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    # Keep gap_thresh small (max 5px) so thin gutters between panels are preserved and not erased
    gap_thresh = max(2, min(5, int(w * 0.005)))
    for i in range(len(smoothed_content)):
        if not smoothed_content[i]:
            gap_count += 1
        else:
            if 0 < gap_count < gap_thresh:
                smoothed_content[i - gap_count : i] = True
            gap_count = 0

    panels: List[Tuple[int, int]] = []
    in_panel = False
    start_y = 0
    for i in range(h):
        if smoothed_content[i] and not in_panel:
            in_panel = True
            start_y = i
        elif not smoothed_content[i] and in_panel:
            in_panel = False
            end_y = i
            if end_y - start_y >= min_height_px:
                panels.append((start_y, end_y))
    if in_panel:
        end_y = h
        if end_y - start_y >= min_height_px:
            panels.append((start_y, end_y))

    raw_boxes: List[Dict[str, Any]] = []
    for start_y, end_y in panels:
        raw_boxes.append({
            "x": 0,
            "y": start_y,
            "w": w,
            "h": end_y - start_y
        })

    return raw_boxes
