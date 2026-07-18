"""
Moved panel utilities into services.image.utils
"""

import numpy as np
from typing import List, Dict, Tuple, Optional


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

        max_trim_x = int((x2 - x1) * 0.45)
        max_trim_y = int((y2 - y1) * 0.45)

        new_x1 = max(x1, min(trim_x1, x1 + max_trim_x))
        new_y1 = max(y1, min(trim_y1, y1 + max_trim_y))
        new_x2 = min(x2, max(trim_x2, x2 - max_trim_x))
        new_y2 = min(y2, max(trim_y2, y2 - max_trim_y))

        if (new_x2 - new_x1) >= 15 and (new_y2 - new_y1) >= 15:
            return new_x1, new_y1, new_x2 - new_x1, new_y2 - new_y1

    return x1, y1, x2 - x1, y2 - y1


def _filter_solid_noise(
    raw_boxes: List[Dict[str, int]],
    gray_arr: np.ndarray,
    min_w: float,
    height_limit: int,
    auto_split: bool
) -> List[Dict[str, int]]:
    filtered_boxes = []
    for box in raw_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        if auto_split:
            if bh < height_limit:
                continue
        else:
            if bw < min_w or bh < height_limit:
                continue

        try:
            box_slice = gray_arr[by:by+bh, bx:bx+bw]
            if np.std(box_slice) < 5.0:
                continue
        except Exception:
            pass

        filtered_boxes.append(box)
    return filtered_boxes
