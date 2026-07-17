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
    
    merged = True
    while merged:
        merged = False
        new_boxes = []
        skip_indices = set()
        
        for i in range(len(boxes)):
            if i in skip_indices:
                continue
                
            box_a = boxes[i]
            x1_a, y1_a, x2_a, y2_a = box_a["x"], box_a["y"], box_a["x"] + box_a["w"], box_a["y"] + box_a["h"]
            
            for j in range(i + 1, len(boxes)):
                if j in skip_indices:
                    continue
                    
                box_b = boxes[j]
                x1_b, y1_b, x2_b, y2_b = box_b["x"], box_b["y"], box_b["x"] + box_b["w"], box_b["y"] + box_b["h"]
                
                w_a, h_a = x2_a - x1_a, y2_a - y1_a
                w_b, h_b = x2_b - x1_b, y2_b - y1_b
                
                w_min = min(w_a, w_b)
                x_overlap_val = max(0, min(x2_a, x2_b) - max(x1_a, x1_b))
                h_overlap_ratio = x_overlap_val / w_min if w_min > 0 else 0
                
                y_overlap_val = max(0, min(y2_a, y2_b) - max(y1_a, y1_b))
                y_dist = max(0, y1_b - y2_a) if y1_b >= y2_a else max(0, y1_a - y2_b)
                
                should_merge = False
                if y_overlap_val > 0:
                    if h_overlap_ratio >= 0.5:
                        should_merge = True
                else:
                    if h_overlap_ratio > 0 and y_dist <= merge_threshold:
                        should_merge = True
                
                if should_merge:
                    x1_a = min(x1_a, x1_b)
                    y1_a = min(y1_a, y1_b)
                    x2_a = max(x2_a, x2_b)
                    y2_a = max(y2_a, y2_b)
                    
                    box_a = {
                        "x": x1_a,
                        "y": y1_a,
                        "w": x2_a - x1_a,
                        "h": y2_a - y1_a
                    }
                    skip_indices.add(j)
                    merged = True
            
            new_boxes.append(box_a)
        
        boxes = new_boxes
        if not merged:
            break
            
    return boxes


def protect_slice_y(y: int, ocr_boxes: List[Dict[str, int]], h_img: int) -> int:
    """
    Shifts the horizontal slice line 'y' to the nearest outer edge of any intersecting speech bubble
    bounding box to prevent slicing a speech bubble or text in half.
    """
    for box in ocr_boxes:
        by1 = box["y"]
        by2 = box["y"] + box["h"]
        if by1 < y < by2:
            if abs(y - by1) < abs(y - by2):
                y = max(0, by1)
            else:
                y = min(h_img, by2)
    return y


def protect_slice_x(x: int, ocr_boxes: List[Dict[str, int]], w_img: int) -> int:
    """
    Shifts the vertical slice line 'x' to the nearest outer edge of any intersecting speech bubble
    bounding box to prevent slicing a speech bubble or text in half.
    """
    for box in ocr_boxes:
        bx1 = box["x"]
        bx2 = box["x"] + box["w"]
        if bx1 < x < bx2:
            if abs(x - bx1) < abs(x - bx2):
                x = max(0, bx1)
            else:
                x = min(w_img, bx2)
    return x
