"""
Moved panel utilities into services.image.utils
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Optional, Any

logger = logging.getLogger("sonikoma.services.image.panel_image_utils")


def trim_solid_borders(
    gray_arr: np.ndarray,
    x: int,
    y: int,
    w_box: int,
    h_box: int,
    bg_mode: str,
    global_bg_val: Optional[float] = None
) -> Tuple[int, int, int, int]:
    # Implementation preserved from original file
    h_img, w_img = gray_arr.shape

    x1 = max(0, min(w_img - 1, x))
    y1 = max(0, min(h_img - 1, y))
    x2 = max(0, min(w_img, x + w_box))
    y2 = max(0, min(h_img, y + h_box))

    if (x2 - x1) < 15 or (y2 - y1) < 15:
        return x1, y1, x2 - x1, y2 - y1

    roi = gray_arr[y1:y2, x1:x2]

    if bg_mode == "white":
        bg_val = 255.0
    elif bg_mode == "black":
        bg_val = 0.0
    elif global_bg_val is not None:
        bg_val = global_bg_val
    else:
        corners = __import__('numpy').concatenate([
            roi[:3, :3].flatten(),
            roi[-3:, :3].flatten(),
            roi[:3, -3:].flatten(),
            roi[-3:, -3:].flatten()
        ])
        bg_val = __import__('numpy').median(corners) if len(corners) > 0 else 255.0

    if bg_val >= 200.0:
        content_mask = (roi < 235)
    elif bg_val <= 55.0:
        content_mask = (roi > 30)
    else:
        content_mask = (np.abs(roi.astype(float) - bg_val) > 15)

    try:
        import cv2
        kernel = np.ones((2, 2), dtype=np.uint8)
        content_mask_cleaned = cv2.morphologyEx(content_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    except ImportError:
        content_mask_cleaned = content_mask.astype(np.uint8)

    if not np.any(content_mask_cleaned > 0):
        content_mask_cleaned = content_mask.astype(np.uint8)

    row_sums = np.sum(content_mask_cleaned > 0, axis=1)
    col_sums = np.sum(content_mask_cleaned > 0, axis=0)

    row_indices = np.where(row_sums >= 1)[0]
    col_indices = np.where(col_sums >= 1)[0]

    if len(row_indices) > 0 and len(col_indices) > 0:
        trim_y1 = y1 + int(row_indices[0])
        trim_y2 = y1 + int(row_indices[-1]) + 1
        trim_x1 = x1 + int(col_indices[0])
        trim_x2 = x1 + int(col_indices[-1]) + 1

        max_trim_x = int((x2 - x1) * 0.08)
        max_trim_y = int((y2 - y1) * 0.08)

        new_x1 = max(x1, min(trim_x1, x1 + max_trim_x))
        new_y1 = max(y1, min(trim_y1, y1 + max_trim_y))
        new_x2 = min(x2, max(trim_x2, x2 - max_trim_x))
        new_y2 = min(y2, max(trim_y2, y2 - max_trim_y))

        if (new_x2 - new_x1) >= 15 and (new_y2 - new_y1) >= 15:
            if new_x1 != x1 or new_y1 != y1 or (new_x2 - new_x1) != (x2 - x1) or (new_y2 - new_y1) != (y2 - y1):
                pass
            return new_x1, new_y1, new_x2 - new_x1, new_y2 - new_y1

    return x1, y1, x2 - x1, y2 - y1


def _filter_solid_noise(
    raw_boxes: List[Dict[str, Any]],
    gray_arr: np.ndarray,
    min_w: float,
    height_limit: int,
    auto_split: bool,
    min_panel_area: float = 5000.0,
    max_aspect_ratio: float = 10.0,
    min_aspect_ratio: float = 0.1,
    noise_std_thresh: float = 5.0,
    flat_row_ratio: float = 0.80,
) -> List[Dict[str, Any]]:
    filtered_boxes = []
    h_img, w_img = gray_arr.shape
    img_area = float(w_img * h_img)
    effective_min_area = min(min_panel_area, max(500.0, img_area * 0.01))

    for box in raw_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        area = float(bw * bh)

        # Reject full-frame outer bounding boxes (>= 98% width AND >= 98% height or >= 96% area)
        if bw >= w_img * 0.98 and bh >= h_img * 0.98:
            continue
        if area >= (img_area * 0.96):
            continue

        # Enforce minimum area threshold suitable for comic panels (e.g. min_panel_area = 5000)
        if area < effective_min_area:
            continue

        # Discard thin horizontal/vertical strip artifacts (allow tall webtoon panels when auto_split=True)
        aspect = float(bw) / float(bh) if bh > 0 else 1.0
        effective_min_aspect = min(min_aspect_ratio, float(w_img) / float(max(1, h_img))) if auto_split else min_aspect_ratio
        if aspect > max_aspect_ratio or aspect < effective_min_aspect or bw < 30 or bh < 30:
            continue

        if auto_split:
            if bh < height_limit:
                continue
        else:
            if bw < min_w or bh < height_limit:
                continue

        try:
            box_slice = gray_arr[by:by+bh, bx:bx+bw]
            # Check for text strokes / line transitions
            box_diffs = np.abs(np.diff(box_slice.astype(float), axis=1))
            has_text_strokes = (np.sum(box_diffs > 15.0) >= 4)

            slice_std = float(np.std(box_slice))
            if slice_std < noise_std_thresh and not has_text_strokes:
                continue
            row_stds = np.std(box_slice, axis=1)
            flat_rows = np.sum(row_stds < 3.0)
            flat_ratio = float(flat_rows) / float(max(1, bh))
            effective_flat_ratio = 0.98 if auto_split else flat_row_ratio
            if flat_ratio > effective_flat_ratio and not has_text_strokes:
                continue
        except Exception:
            pass

        filtered_boxes.append(box)

    return filtered_boxes

