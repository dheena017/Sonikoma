"""
backend/app/services/image/panel_grid_detect.py
─────────────────────────────────────────────────────────────────────────────
Grid layout panel detection strategies using OpenCV contours or PIL projection profiles.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Any

logger = logging.getLogger("sonikoma.services.image.panel_grid_detect")


def _detect_panels_grid_cv(
    gray: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    canny_low: int,
    canny_high: int,
    close_kernel_size: int,
    high_sensitivity: bool = False,
    min_panel_area: float = 5000.0,
    max_aspect_ratio: float = 10.0,
    min_aspect_ratio: float = 0.1,
) -> List[Dict[str, Any]]:
    """
    Standard contour detection strategy using OpenCV for grid layout pages.
    Performs Morphological Closing prior to finding contours to bridge border lines so panels
    are detected as complete, unified blocks instead of being chopped in half.
    Applies bounding box filtering with min_panel_area and discards thin strip artifacts.
    """
    import cv2
    logger.debug(
        f"[Grid Detect CV] Starting OpenCV contour detection: gray_shape={gray.shape}, "
        f"is_white_bg={is_white_bg}, threshold_val={threshold_val}, canny=({canny_low},{canny_high}), "
        f"kernel={close_kernel_size}, high_sensitivity={high_sensitivity}"
    )
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
    
    # Morphological Closing: Bridges border lines and whitespace gaps inside panels prior to contour detection
    kernel_size = max(5, close_kernel_size)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
    
    # Extract outer contours on closed morphological mask
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    h_img, w_img = gray.shape
    img_area = float(w_img * h_img)
    effective_min_area = min(min_panel_area, max(500.0, img_area * 0.01))

    raw_boxes: List[Dict[str, Any]] = []
    if contours:
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)

            # Filter out full-page bounding box that encloses >= 98% of width and height
            if w_box >= w_img * 0.98 and h_box >= h_img * 0.98:
                continue

            area = float(w_box * h_box)
            if area >= (img_area * 0.95):
                continue

            # Filter noise by minimum panel area threshold (e.g. min_panel_area = 5000)
            if area < effective_min_area:
                continue

            # Discard thin horizontal/vertical strip artifacts and extreme aspect ratio noise
            aspect = float(w_box) / float(h_box) if h_box > 0 else 1.0
            if aspect > max_aspect_ratio or aspect < min_aspect_ratio or w_box < 30 or h_box < 30:
                continue

            raw_boxes.append({"x": x_box, "y": y_box, "w": w_box, "h": h_box})
            
    logger.debug(f"[Grid Detect CV] Extracted {len(contours) if contours else 0} contours -> {len(raw_boxes)} candidate panel boxes.")
    return raw_boxes


def _detect_panels_grid_pil(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    sensitivity: float,
    min_height_px: int,
    min_panel_area: float = 5000.0,
    max_aspect_ratio: float = 10.0,
    min_aspect_ratio: float = 0.1,
) -> List[Dict[str, Any]]:
    """
    Standard projection profile detection strategy using PIL fallback for grid layout pages.
    Filters bounding boxes by min_panel_area threshold and discards thin horizontal/vertical strip artifacts.
    """
    h, w = gray_arr.shape
    logger.debug(f"[Grid Detect PIL] Starting projection profile search: shape={w}x{h}, is_white_bg={is_white_bg}")
    img_area = float(w * h)
    effective_min_area = min(min_panel_area, max(500.0, img_area * 0.01))
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
            
    raw_boxes: List[Dict[str, Any]] = []
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

        bw = end_x - start_x
        bh = end_y - start_y
        area = float(bw * bh)
        aspect = float(bw) / float(bh) if bh > 0 else 1.0

        if area >= effective_min_area and min_aspect_ratio <= aspect <= max_aspect_ratio and bw >= 30 and bh >= 30:
            raw_boxes.append({
                "x": start_x,
                "y": start_y,
                "w": bw,
                "h": bh
            })
        
    return raw_boxes

