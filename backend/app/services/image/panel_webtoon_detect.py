"""
backend/app/services/image/panel_webtoon_detect.py
─────────────────────────────────────────────────────────────────────────────
Webtoon vertical strip slicing algorithms, background mode color detection,
and column subdivision.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Optional

from services.image.panel_box_utils import protect_slice_x, protect_slice_y

logger = logging.getLogger("sonikoma.services.image.panel_webtoon_detect")


def _detect_bg_color_and_threshold(
    gray_arr: np.ndarray, bg_mode: str, sensitivity: float
) -> Tuple[bool, int]:
    """
    Detects if the background is white/light vs. black/dark by sampling edges
    at a 2% inset. Calculates and returns (is_white_bg, threshold_val).
    """
    h, w = gray_arr.shape
    if bg_mode == "auto":
        inset_y = max(1, int(h * 0.02))
        inset_x = max(1, int(w * 0.02))
        edge_samples = np.concatenate([
            gray_arr[inset_y, :],
            gray_arr[-inset_y - 1, :],
            gray_arr[:, inset_x],
            gray_arr[:, -inset_x - 1]
        ])
        median_bg = np.median(edge_samples)
        is_white_bg = bool(median_bg > 127)
    else:
        is_white_bg = bg_mode == "white"

    threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    threshold_val = max(5, min(250, threshold_val))
    return is_white_bg, threshold_val


def _detect_panels_webtoon(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    min_height_px: int,
    min_width_pct: float,
    ocr_boxes: Optional[List[Dict[str, int]]] = None
) -> List[Dict[str, int]]:
    """
    Webtoon gutter slicing strategy for tall strips.
    Identifies horizontal gaps (gutters) containing mostly background pixels,
    then checks within each horizontal panel row slice for vertical subdivisions.
    Includes Speech Bubble Protection to prevent splitting dialog bubbles.
    """
    h, w = gray_arr.shape
    margin = max(4, min(40, int(w * 0.05)))
    gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
    w_center = gray_center.shape[1]

    if is_white_bg:
        bg_pixel_count = np.sum(gray_center > threshold_val, axis=1)
    else:
        bg_pixel_count = np.sum(gray_center < threshold_val, axis=1)

    is_gutter_row = (bg_pixel_count / w_center) >= 0.95
    is_content_row = ~is_gutter_row

    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    gap_thresh = max(15, min(80, int(w * 0.04)))
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
            if ocr_boxes:
                start_y = protect_slice_y(start_y, ocr_boxes, h)
        elif not smoothed_content[i] and in_panel:
            in_panel = False
            end_y = i
            if ocr_boxes:
                end_y = protect_slice_y(end_y, ocr_boxes, h)
            if end_y - start_y >= min_height_px:
                panels.append((start_y, end_y))
    if in_panel:
        end_y = h
        if ocr_boxes:
            end_y = protect_slice_y(end_y, ocr_boxes, h)
        if end_y - start_y >= min_height_px:
            panels.append((start_y, end_y))

    raw_boxes: List[Dict[str, int]] = []
    for start_y, end_y in panels:
        panel_slice = gray_arr[start_y:end_y, :]
        col_vars = np.var(panel_slice, axis=0)
        col_means = np.mean(panel_slice, axis=0)

        if is_white_bg:
            is_content_col = (col_vars >= 2) | (col_means < 240)
        else:
            is_content_col = (col_vars >= 2) | (col_means > 15)

        sub_panels: List[Tuple[int, int]] = []
        in_sub = False
        start_x = 0

        smoothed_col = np.copy(is_content_col)
        col_gap_count = 0
        col_gap_thresh = max(18, min(60, int(w * 0.08)))

        for j in range(len(smoothed_col)):
            if not smoothed_col[j]:
                col_gap_count += 1
            else:
                if 0 < col_gap_count < col_gap_thresh:
                    smoothed_col[j - col_gap_count : j] = True
                col_gap_count = 0

        for j in range(w):
            if smoothed_col[j] and not in_sub:
                in_sub = True
                start_x = j
                if ocr_boxes:
                    start_x = protect_slice_x(start_x, ocr_boxes, w)
            elif not smoothed_col[j] and in_sub:
                in_sub = False
                end_x = j
                if ocr_boxes:
                    end_x = protect_slice_x(end_x, ocr_boxes, w)
                if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                    sub_panels.append((start_x, end_x))
        if in_sub:
            end_x = w
            if ocr_boxes:
                end_x = protect_slice_x(end_x, ocr_boxes, w)
            if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                sub_panels.append((start_x, end_x))

        if not sub_panels:
            sub_panels = [(0, w)]

        slice_h = end_y - start_y
        is_header = False
        if start_y < int(h * 0.15):
            is_header = True
        elif float(w) / float(slice_h) > 3.0 if slice_h > 0 else False:
            is_header = True

        if is_header:
            logger.info(f"[Panel Detection] Slicing protected: horizontal slice {start_y}-{end_y} identified as header/banner. Disabling vertical subdivision.")
            sub_panels = [(0, w)]

        for sx, ex in sub_panels:
            pad_sx = max(0, sx - 8)
            pad_ex = min(w, ex + 8)

            box_w = pad_ex - pad_sx
            min_w = int(w * min_width_pct)
            if box_w < min_w:
                shortage = min_w - box_w
                pad_sx = max(0, pad_sx - shortage // 2)
                pad_ex = min(w, pad_sx + min_w)
                if pad_ex - pad_sx < min_w:
                    pad_sx = max(0, pad_ex - min_w)

            raw_boxes.append({
                "x": pad_sx,
                "y": start_y,
                "w": pad_ex - pad_sx,
                "h": end_y - start_y
            })

    return raw_boxes
