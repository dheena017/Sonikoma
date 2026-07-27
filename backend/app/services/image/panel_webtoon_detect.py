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
) -> Tuple[bool, int]:
    """
    Detects if the background is white/light vs. black/dark by sampling edges
    at a 2% inset. Calculates and returns adaptive (is_white_bg, threshold_val).
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
        threshold_val = int(min(253, max(175, median_bg - (sensitivity * 1.2))))
    else:
        threshold_val = int(max(2, min(80, median_bg + (sensitivity * 1.2))))
    return is_white_bg, threshold_val


def _detect_panels_webtoon(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    High-precision Webtoon gutter slicing strategy for tall strips.
    Identifies horizontal gaps (gutters) containing mostly background pixels or low row variance,
    then constructs full-width horizontal panel boxes with Speech Bubble Protection.
    """
    h, w = gray_arr.shape
    margin = max(4, min(40, int(w * 0.05)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    row_stds = np.std(gray_center, axis=1)

    if is_white_bg:
        bg_pixel_count = np.sum(gray_center > threshold_val, axis=1)
    else:
        bg_pixel_count = np.sum(gray_center < threshold_val, axis=1)

    is_gutter_row = ((bg_pixel_count / w_center) >= 0.92) | ((row_stds < 3.5) & ((bg_pixel_count / w_center) >= 0.85))
    is_content_row = ~is_gutter_row

    # Speech Bubble & OCR Protection: Ensure rows with speech bubbles are treated as content rows
    if ocr_boxes:
        for box in ocr_boxes:
            by1 = max(0, int(box.get("y", 0)) - 12)
            by2 = min(h, int(box.get("y", 0) + box.get("h", 0)) + 12)
            if by2 > by1:
                is_content_row[by1:by2] = True

    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    gap_thresh = max(3, min(12, int(w * 0.008)))
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

    # Partition gutters evenly between adjacent panels for seamless Webtoon strip slicing
    if len(panels) > 1:
        partitioned_panels = []
        for i in range(len(panels)):
            cur_start, cur_end = panels[i]
            prev_end = panels[i - 1][1] if i > 0 else 0
            next_start = panels[i + 1][0] if i < len(panels) - 1 else h

            slice_start = (prev_end + cur_start) // 2 if i > 0 else 0
            slice_end = (cur_end + next_start) // 2 if i < len(panels) - 1 else h
            partitioned_panels.append((slice_start, slice_end))
        panels = partitioned_panels

    raw_boxes: List[Dict[str, Any]] = []
    for start_y, end_y in panels:
        # For webtoon vertical strips, panels are full-width continuous scenes.
        # Disabling vertical column subdivision guarantees characters and speech bubbles
        # are never cut in half or split into tiny fragments.
        raw_boxes.append({
            "x": 0,
            "y": start_y,
            "w": w,
            "h": end_y - start_y
        })

    return raw_boxes
