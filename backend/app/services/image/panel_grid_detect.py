"""
backend/app/services/image/panel_grid_detect.py
─────────────────────────────────────────────────────────────────────────────
Grid layout panel detection strategies using OpenCV contours or PIL projection profiles.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from typing import List, Dict, Tuple


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
