import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Tuple, Optional
import numpy as np
from PIL import Image

logger = logging.getLogger("sonikoma.services.detect_panels")

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
        # Need to expand width
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
        # Need to expand height
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
                
                # Compute width and height of each box
                w_a, h_a = x2_a - x1_a, y2_a - y1_a
                w_b, h_b = x2_b - x1_b, y2_b - y1_b
                
                # Check horizontal overlap metrics
                w_min = min(w_a, w_b)
                x_overlap_val = max(0, min(x2_a, x2_b) - max(x1_a, x1_b))
                h_overlap_ratio = x_overlap_val / w_min if w_min > 0 else 0
                
                # Check vertical overlap metrics
                y_overlap_val = max(0, min(y2_a, y2_b) - max(y1_a, y1_b))
                
                # Check vertical distance
                y_dist = max(0, y1_b - y2_a) if y1_b >= y2_a else max(0, y1_a - y2_b)
                
                # Decide whether to merge:
                # 1. If they overlap vertically (y_overlap_val > 0), they are side-by-side or nested.
                #    We only merge if they have a very high horizontal overlap (h_overlap_ratio >= 0.5).
                # 2. If they do not overlap vertically (y_overlap_val == 0), they are stacked.
                #    We merge if they have any horizontal overlap (h_overlap_ratio > 0) AND y_dist <= merge_threshold.
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


def protect_slice_y(y: int, ocr_boxes: List[Dict[str, int]], h_img: int) -> int:
    """
    Shifts the horizontal slice line 'y' to the nearest outer edge of any intersecting speech bubble
    bounding box to prevent slicing a speech bubble or text in half.
    """
    for box in ocr_boxes:
        by1 = box["y"]
        by2 = box["y"] + box["h"]
        # Check if y intersects vertically
        if by1 < y < by2:
            # Shift to nearest edge
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
        # Check if x intersects horizontally
        if bx1 < x < bx2:
            # Shift to nearest edge
            if abs(x - bx1) < abs(x - bx2):
                x = max(0, bx1)
            else:
                x = min(w_img, bx2)
    return x


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

    # Smooth short content gaps to avoid split inside panels (e.g. text/horizontal separators)
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

    # Extract horizontal slices (panel y-ranges)
    panels: List[Tuple[int, int]] = []
    in_panel = False
    start_y = 0
    for i in range(h):
        if smoothed_content[i] and not in_panel:
            in_panel = True
            start_y = i
            # Apply Speech Bubble Protection to start_y
            if ocr_boxes:
                start_y = protect_slice_y(start_y, ocr_boxes, h)
        elif not smoothed_content[i] and in_panel:
            in_panel = False
            end_y = i
            # Apply Speech Bubble Protection to end_y
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

        # Scan for multiple vertical columns inside this slice
        sub_panels: List[Tuple[int, int]] = []
        in_sub = False
        start_x = 0

        # Smooth horizontal column gaps (avoid split on small spacing inside the same panel)
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
                # Apply Speech Bubble Protection to start_x
                if ocr_boxes:
                    start_x = protect_slice_x(start_x, ocr_boxes, w)
            elif not smoothed_col[j] and in_sub:
                in_sub = False
                end_x = j
                # Apply Speech Bubble Protection to end_x
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

        for sx, ex in sub_panels:
            pad_sx = max(0, sx - 8)
            pad_ex = min(w, ex + 8)

            # Enforce minimum width constraints
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


def _detect_panels_grid_cv(
    gray: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    canny_low: int,
    canny_high: int,
    close_kernel_size: int,
    high_sensitivity: bool = False
) -> List[Dict[str, int]]:
    """
    Standard contour detection strategy using OpenCV for grid layout pages.
    """
    import cv2
    if high_sensitivity:
        # Use adaptive thresholding for highly stylized/sensitive pages
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV if is_white_bg else cv2.THRESH_BINARY,
            25, 5
        )
    else:
        if is_white_bg:
            _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY_INV)
        else:
            _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY)
        
    edges = cv2.Canny(gray, canny_low, canny_high)
    merged_mask = cv2.bitwise_or(thresh, edges)
    
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_kernel_size, close_kernel_size))
    closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    raw_boxes: List[Dict[str, int]] = []
    if contours:
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)
            raw_boxes.append({"x": x_box, "y": y_box, "w": w_box, "h": h_box})
            
    return raw_boxes


def _detect_panels_grid_pil(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    sensitivity: float,
    min_height_px: int
) -> List[Dict[str, int]]:
    """
    Standard projection profile detection strategy using PIL fallback for grid layout pages.
    """
    h, w = gray_arr.shape
    row_means = np.mean(gray_arr, axis=1)
    
    thresh_limit = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    thresh_limit = max(5, min(250, thresh_limit))
    
    if is_white_bg:
        is_content_row = row_means < thresh_limit
    else:
        is_content_row = row_means > thresh_limit
        
    # Join small gaps
    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    for i in range(len(smoothed_content)):
        if not smoothed_content[i]:
            gap_count += 1
        else:
            if 0 < gap_count < 22:
                smoothed_content[i - gap_count : i] = True
            gap_count = 0
            
    # Find panels y-coordinates
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
            
    raw_boxes: List[Dict[str, int]] = []
    for start_y, end_y in panels:
        panel_slice = gray_arr[start_y:end_y, :]
        col_means = np.mean(panel_slice, axis=0)
        
        if is_white_bg:
            is_content_col = col_means < (thresh_limit + 2)
        else:
            is_content_col = col_means > (thresh_limit - 2)
            
        content_indices = np.where(is_content_col)[0]
        if len(content_indices) > 0:
            start_x = max(0, int(content_indices[0]) - 5)
            end_x = min(w, int(content_indices[-1]) + 5)
        else:
            start_x = 0
            end_x = w
            
        raw_boxes.append({
            "x": start_x,
            "y": start_y,
            "w": end_x - start_x,
            "h": end_y - start_y
        })
        
    return raw_boxes


def trim_solid_borders(
    gray_arr: np.ndarray,
    x: int,
    y: int,
    w_box: int,
    h_box: int,
    bg_mode: str,
    global_bg_val: Optional[float] = None
) -> Tuple[int, int, int, int]:
    """
    Trims solid-color padding/margins (black, white, or neutral) from the edges
    of a single panel bounding box, prioritizing art content boundaries pixel-by-pixel.
    """
    h_img, w_img = gray_arr.shape

    # Ensure coordinates are within image bounds
    x1 = max(0, min(w_img - 1, x))
    y1 = max(0, min(h_img - 1, y))
    x2 = max(0, min(w_img, x + w_box))
    y2 = max(0, min(h_img, y + h_box))

    # If the box is too small, don't trim
    if (x2 - x1) < 15 or (y2 - y1) < 15:
        return x1, y1, x2 - x1, y2 - y1

    # Extract local ROI
    roi = gray_arr[y1:y2, x1:x2]

    # Determine local or global background reference
    if bg_mode == "white":
        bg_val = 255.0
    elif bg_mode == "black":
        bg_val = 0.0
    elif global_bg_val is not None:
        bg_val = global_bg_val
    else:
        # Fallback to corner median to estimate background color of this ROI
        corners = np.concatenate([
            roi[:3, :3].flatten(),
            roi[-3:, :3].flatten(),
            roi[:3, -3:].flatten(),
            roi[-3:, -3:].flatten()
        ])
        bg_val = np.median(corners) if len(corners) > 0 else 255.0

    # Build exact pixel-by-pixel content mask
    # We consider pixels that deviate sufficiently from the background color as content.
    if bg_val >= 200.0:
        # For very light backgrounds, any darker pixel is content
        content_mask = (roi < 235)
    elif bg_val <= 55.0:
        # For very dark backgrounds, any brighter pixel is content
        content_mask = (roi > 30)
    else:
        # For intermediate backgrounds (gray, neutral), any significant deviation is content
        content_mask = (np.abs(roi.astype(float) - bg_val) > 15)

    # Clean up single-pixel sensor noise/speckles using morphological opening
    try:
        import cv2
        kernel = np.ones((2, 2), dtype=np.uint8)
        content_mask_cleaned = cv2.morphologyEx(content_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
    except ImportError:
        content_mask_cleaned = content_mask.astype(np.uint8)

    # If opening emptied the mask completely (e.g., extremely thin/faint lines), fallback to original mask
    if not np.any(content_mask_cleaned > 0):
        content_mask_cleaned = content_mask.astype(np.uint8)

    # Find row and col indices containing content pixels
    # We require at least 1 content pixel in the row/col (pure pixel-by-pixel snapping)
    row_sums = np.sum(content_mask_cleaned > 0, axis=1)
    col_sums = np.sum(content_mask_cleaned > 0, axis=0)

    row_indices = np.where(row_sums >= 1)[0]
    col_indices = np.where(col_sums >= 1)[0]

    if len(row_indices) > 0 and len(col_indices) > 0:
        trim_y1 = y1 + int(row_indices[0])
        trim_y2 = y1 + int(row_indices[-1]) + 1
        trim_x1 = x1 + int(col_indices[0])
        trim_x2 = x1 + int(col_indices[-1]) + 1

        # Enforce maximum trim safety constraint (45% from each outer edge)
        # to prevent catastrophic over-cropping on complex panels
        max_trim_x = int((x2 - x1) * 0.45)
        max_trim_y = int((y2 - y1) * 0.45)

        new_x1 = max(x1, min(trim_x1, x1 + max_trim_x))
        new_y1 = max(y1, min(trim_y1, y1 + max_trim_y))
        new_x2 = min(x2, max(trim_x2, x2 - max_trim_x))
        new_y2 = min(y2, max(trim_y2, y2 - max_trim_y))

        # Ensure we don't collapse the box below a minimum size
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
    """
    Filters out noise boxes by checking dimensions and standard deviation
    (which screens out solid-colored non-content regions).
    """
    filtered_boxes = []
    for box in raw_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        if auto_split:
            if bh < height_limit:
                continue
        else:
            if bw < min_w or bh < height_limit:
                continue

        # Standard deviation content filter to discard solid color noise
        try:
            box_slice = gray_arr[by:by+bh, bx:bx+bw]
            if np.std(box_slice) < 5.0:
                continue
        except Exception:
            pass

        filtered_boxes.append(box)
    return filtered_boxes


def run_cv_detection(
    image_path: str,
    sensitivity: float,
    bg_mode: str,
    min_width_pct: float,
    min_height_px: int,
    merge_threshold: int,
    aspect_ratio_str: str,
    canny_low: int = 20,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    auto_split: bool = True
) -> List[Dict[str, any]]:
    """
    Main orchestration function for panel detection. Loads the image, runs background
    detection, routes to the appropriate detection strategy (Webtoon Slicing vs. Grid Contours),
    performs noise filtering, overlap merging, padding, and scales back to percentages.

    Includes Speech Bubble Protection, Dynamic scale-aware parameter adjustments,
    automatic global border trimming, and robust Dual-Pass high-sensitivity fallback.
    """
    logger.info(f"[Panel Detection] Starting local panel detection on {image_path}")
    
    # 1. Attempt to load image using OpenCV, falling back to PIL
    try:
        import cv2
        has_cv = True
    except ImportError:
        has_cv = False

    gray_arr: Optional[np.ndarray] = None
    orig_w: int = 0
    orig_h: int = 0

    if has_cv:
        img = cv2.imread(image_path)
        if img is None:
            return []
        orig_h, orig_w, c = img.shape
        if orig_h == 0 or orig_w == 0:
            return []
        gray_arr = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        try:
            pil_img = Image.open(image_path)
        except Exception:
            return []

        orig_w, orig_h = pil_img.size
        if orig_w == 0 or orig_h == 0:
            return []
        gray_arr = np.array(pil_img.convert("L"))

    if gray_arr is None:
        return []

    # 1b. Dynamic Parameter Scaling based on image resolution
    # Standard reference: 1500 x 1500
    ref_area = 1500.0 * 1500.0
    img_area = float(orig_w * orig_h)
    scale_factor = (img_area / ref_area) ** 0.5

    scaled_min_height_px = max(15, min(120, int(min_height_px * scale_factor)))
    scaled_min_width_pct = max(0.05, min(0.25, min_width_pct * (0.5 + 0.5 * scale_factor)))
    scaled_close_kernel = max(3, min(40, int(close_kernel_size * scale_factor)))

    # 1c. Load OCR Bounds (Speech Bubble Protection) asynchronously or synchronously
    ocr_boxes: List[Dict[str, int]] = []
    try:
        import asyncio
        from media.image.ocr import extract_full_ocr_data
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(lambda: asyncio.run(extract_full_ocr_data(image_path)))
                ocr_results = future.result()
        else:
            ocr_results = loop.run_until_complete(extract_full_ocr_data(image_path))

        for res in ocr_results:
            pts = np.array(res["box"], dtype=np.int32)
            if has_cv:
                bx, by, bw, bh = cv2.boundingRect(pts)
            else:
                xs = [pt[0] for pt in res["box"]]
                ys = [pt[1] for pt in res["box"]]
                bx, by, bw, bh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
            ocr_boxes.append({"x": bx, "y": by, "w": bw, "h": bh})
    except Exception as e:
        logger.warning(f"[Panel Detection] Failed to retrieve OCR bounds for speech bubble protection: {e}")

    # 1d. Global Pre-processing step: Detect and trim uniform black/dark/light borders/margins from entire page
    crop_x, crop_y, crop_w, crop_h = trim_solid_borders(gray_arr, 0, 0, orig_w, orig_h, bg_mode)

    w, h = orig_w, orig_h
    if crop_w > 0 and crop_h > 0 and (crop_w < orig_w or crop_h < orig_h):
        logger.info(f"[Panel Detection] Trimming global solid margins: x={crop_x}, y={crop_y}, w={crop_w}, h={crop_h}")
        gray_arr_processed = gray_arr[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w]
        w, h = crop_w, crop_h

        # Adjust OCR bounds relative to cropped coordinate space
        shifted_ocr_boxes = []
        for box in ocr_boxes:
            shifted_ocr_boxes.append({
                "x": max(0, box["x"] - crop_x),
                "y": max(0, box["y"] - crop_y),
                "w": box["w"],
                "h": box["h"]
            })
        ocr_boxes = shifted_ocr_boxes
    else:
        gray_arr_processed = gray_arr

    # 2. Detect background characteristics
    is_white_bg, threshold_val = _detect_bg_color_and_threshold(gray_arr_processed, bg_mode, sensitivity)
    is_tall_strip = (h / w > 1.2)

    # 3. Dual-Pass Detection Orchestrator
    passes = [False, True] if has_cv else [False] # Pass 1: Standard, Pass 2: High Sensitivity (adaptive)
    raw_boxes: List[Dict[str, int]] = []

    for high_sensitivity in passes:
        if auto_split and is_tall_strip:
            logger.info(f"[Panel Detection] Running Webtoon Slicing strategy (high_sensitivity={high_sensitivity})")
            raw_boxes = _detect_panels_webtoon(gray_arr_processed, is_white_bg, threshold_val, scaled_min_height_px, scaled_min_width_pct, ocr_boxes)
        else:
            logger.info(f"[Panel Detection] Running Grid strategy (high_sensitivity={high_sensitivity})")
            if has_cv:
                raw_boxes = _detect_panels_grid_cv(gray_arr_processed, is_white_bg, threshold_val, canny_low, canny_high, scaled_close_kernel, high_sensitivity)
            else:
                raw_boxes = _detect_panels_grid_pil(gray_arr_processed, is_white_bg, sensitivity, scaled_min_height_px)

        # 4. Filter out solid background noise
        min_w = w * scaled_min_width_pct
        filtered_boxes = _filter_solid_noise(raw_boxes, gray_arr_processed, min_w, scaled_min_height_px, auto_split)

        # 5. Merge overlapping or stacked panel bounding boxes
        merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, merge_threshold)

        # 5b. Content-aware border trimming step on individual boxes
        if bg_mode == "white":
            median_bg = 255.0
        elif bg_mode == "black":
            median_bg = 0.0
        else:
            inset_y = max(1, int(h * 0.02))
            inset_x = max(1, int(w * 0.02))
            edge_samples = np.concatenate([
                gray_arr_processed[inset_y, :],
                gray_arr_processed[-inset_y - 1, :],
                gray_arr_processed[:, inset_x],
                gray_arr_processed[:, -inset_x - 1]
            ])
            median_bg = float(np.median(edge_samples))

        trimmed_boxes = []
        for box in merged_boxes:
            bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
            tx, ty, tw, th = trim_solid_borders(gray_arr_processed, bx, by, bw, bh, bg_mode, median_bg)
            # Only retain panels that still contain actual art content size (>= 15px)
            if tw >= 15 and th >= 15:
                trimmed_boxes.append({"x": tx, "y": ty, "w": tw, "h": th})
        merged_boxes = trimmed_boxes

        # Validation check for Dual Pass fallback:
        # If we found some panels, and none of them are highly irregular (extremely tall/wide mistakes, e.g., > 5.0 aspect ratio),
        # then we accept the result and break. Otherwise, we retry with high sensitivity.
        if len(merged_boxes) > 0:
            has_irregular = False
            for box in merged_boxes:
                aspect = float(box["w"]) / float(box["h"]) if box["h"] > 0 else 1.0
                if aspect > 5.0 or aspect < 0.2:
                    has_irregular = True
                    break
            if not has_irregular:
                break
            else:
                logger.info("[Panel Detection] Irregular panels detected; re-running with high sensitivity fallback.")
        else:
            logger.info("[Panel Detection] 0 panels detected; re-running with high sensitivity fallback.")

    # 6. Apply post-merge vertical padding for tall webtoon strips, map coordinates back to original size, format & scale to percent
    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    
    for box in merged_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        
        # Apply 8px vertical padding to sliced panels (helps framing and prevents borders from being cut)
        if auto_split and is_tall_strip:
            pad_by = max(0, by - 8)
            pad_ey = min(h, by + bh + 8)
            by = pad_by
            bh = pad_ey - pad_by
            
        # Map processed/trimmed coordinates back to original uncropped image space
        bx += crop_x
        by += crop_y

        x, y, w_box, h_box = adjust_to_aspect_ratio(
            bx, by, bw, bh, orig_w, orig_h, aspect_ratio_str
        )
        
        # Validate coordinates are within uncropped original image boundaries
        if x < 0 or y < 0 or w_box <= 0 or h_box <= 0 or (x + w_box) > orig_w or (y + h_box) > orig_h:
            raise ValueError(
                f"Panel coordinates out of bounds: x={x}, y={y}, w_box={w_box}, h_box={h_box} for image of size {orig_w}x{orig_h}"
            )
        
        crop_top = (y / orig_h) * 100
        crop_bottom = ((orig_h - (y + h_box)) / orig_h) * 100
        crop_left = (x / orig_w) * 100
        crop_right = ((orig_w - (x + w_box)) / orig_w) * 100
        
        final_panels.append({
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
            "width": int(w_box),
            "height": int(h_box),
            "area": int(w_box * h_box)
        })
        
    return sorted(final_panels, key=lambda b: b["cropTop"])


def main():
    parser = argparse.ArgumentParser(description="Local OpenCV/PIL Panel Detector")
    parser.add_argument("--image_path", required=True, help="Path to input image")
    parser.add_argument("--sensitivity", type=float, default=30.0, help="Tolerance sensitivity (0-100)")
    parser.add_argument("--background_mode", default="auto", choices=["auto", "white", "black"], help="Margin background color mode")
    parser.add_argument("--min_width_pct", type=float, default=0.15, help="Minimum width percentage (0.0 - 1.0)")
    parser.add_argument("--min_height_px", type=int, default=60, help="Minimum height in pixels")
    parser.add_argument("--merge_threshold", type=int, default=20, help="Vertical overlap merge threshold in pixels")
    parser.add_argument("--aspect_ratio", default="free", choices=["free", "1:1", "16:9", "9:16", "4:3"], help="Target aspect ratio")
    parser.add_argument("--canny_low", type=int, default=20, help="Canny low threshold")
    parser.add_argument("--canny_high", type=int, default=100, help="Canny high threshold")
    parser.add_argument("--close_kernel_size", type=int, default=15, help="Morphological close kernel size")
    
    parser.add_argument("--auto_split", action="store_true", default=True, help="Automatically split tall strips at gutters")
    parser.add_argument("--no_auto_split", dest="auto_split", action="store_false", help="Disable automatic strip splitting")
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image_path):
        print(json.dumps({"success": False, "error": f"Image path {args.image_path} does not exist."}))
        sys.exit(1)
        
    try:
        panels = run_cv_detection(
            image_path=args.image_path,
            sensitivity=args.sensitivity,
            bg_mode=args.background_mode,
            min_width_pct=args.min_width_pct,
            min_height_px=args.min_height_px,
            merge_threshold=args.merge_threshold,
            aspect_ratio_str=args.aspect_ratio,
            canny_low=args.canny_low,
            canny_high=args.canny_high,
            close_kernel_size=args.close_kernel_size,
            auto_split=args.auto_split
        )
        print(json.dumps({"success": True, "panels": panels, "message": f"Detected {len(panels)} panels."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()