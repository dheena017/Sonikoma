"""
backend/app/services/image/panel_box_utils.py
─────────────────────────────────────────────────────────────────────────────
Bounding box geometry utilities: aspect ratio adjustments, overlapping box merges,
and speech bubble / text protection coordinate shifts.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Tuple


def adjust_to_aspect_ratio(
    x: int, y: int, w_box: int, h_box: int, w_img: int, h_img: int, aspect_ratio_str: str
) -> Tuple[int, int, int, int]:
    """
    Expands or adjusts a panel bounding box to match a target aspect ratio,
    ensuring it does not exceed the boundaries of the image.
    """
    if not aspect_ratio_str or aspect_ratio_str == "free":
        return x, y, w_box, h_box

    try:
        if aspect_ratio_str == "1:1":
            target_ratio = 1.0
        elif aspect_ratio_str == "16:9":
            target_ratio = 16.0 / 9.0
        elif aspect_ratio_str == "9:16":
            target_ratio = 9.0 / 16.0
        elif aspect_ratio_str == "4:3":
            target_ratio = 4.0 / 3.0
        else:
            return x, y, w_box, h_box
    except Exception:
        return x, y, w_box, h_box

    curr_ratio = float(w_box) / float(h_box) if h_box > 0 else 1.0
    
    if curr_ratio < target_ratio:
        new_w = int(h_box * target_ratio)
        delta = new_w - w_box
        new_x = x - delta // 2
        if new_x < 0:
            new_x = 0
        if new_x + new_w > w_img:
            new_w = w_img - new_x
            new_h = int(new_w / target_ratio)
            y = y + (h_box - new_h) // 2
            h_box = new_h
        w_box = new_w
        x = new_x
    elif curr_ratio > target_ratio:
        new_h = int(w_box / target_ratio)
        delta = new_h - h_box
        new_y = y - delta // 2
        if new_y < 0:
            new_y = 0
        if new_y + new_h > h_img:
            new_h = h_img - new_y
            new_w = int(new_h * target_ratio)
            x = x + (w_box - new_w) // 2
            w_box = new_w
        h_box = new_h
        y = new_y
        
    return x, y, w_box, h_box


def merge_overlapping_boxes(
    boxes: List[Dict[str, int]], w_img: int, h_img: int, merge_threshold: int
) -> List[Dict[str, int]]:
    """
    Merges bounding boxes that have significant vertical/horizontal overlap
    or are stacked vertically within the merge_threshold distance.
    """
    if not boxes or merge_threshold <= 0:
        return boxes
    
    boxes = sorted(boxes, key=lambda b: b["y"])
    from .utils.panel_box_utils import *

    # Backwards-compatible shim to services.image.utils.panel_box_utils
        merged = False
