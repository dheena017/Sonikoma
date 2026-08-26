"""
backend/app/services/image/panel_detection/grid_detector.py
─────────────────────────────────────────────────────────────────────────────
Grid layout panel detection strategies using OpenCV contours or PIL projection profiles.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import numpy as np
from typing import List, Dict, Tuple, Any

logger = logging.getLogger("sonikoma.services.image.panel_detection.grid_detector")


def detect_manga_grid_panels(
    gray: np.ndarray,
    is_white_bg: bool = True,
    threshold_val: int = 220,
    canny_low: int = 25,
    canny_high: int = 120,
    close_kernel_size: int = 7,
    high_sensitivity: bool = False,
    min_panel_area: float = 5000.0,
    max_aspect_ratio: float = 10.0,
    min_aspect_ratio: float = 0.1,
    min_width_pct: float = 0.10,
    min_height_px: int = 40,
    reading_flow: str = "right_to_left"
) -> List[Dict[str, Any]]:
    """
    State-of-the-art 2D Manga/Comic grid panel detector:
    - Multi-scale Canny + Adaptive threshold edge fusion
    - Morphological frame closing preserving gutters
    - Polygonal contour extraction (supports diagonal/slanted frames)
    - Reading flow aware ordering (RTL for Manga, LTR for Western)
    """
    import cv2
    h_img, w_img = gray.shape[:2]
    img_area = float(w_img * h_img)
    effective_min_area = min(min_panel_area, max(200.0, img_area * 0.008))

    # 1. Dynamic Edge & Adaptive Threshold Fusion
    otsu_val, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    dyn_thresh = int(otsu_val) if threshold_val == 220 else threshold_val
    
    if high_sensitivity:
        block_s = max(11, (int(w_img * 0.02) | 1))
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV if is_white_bg else cv2.THRESH_BINARY,
            block_s, 5
        )
    else:
        _, thresh = cv2.threshold(gray, dyn_thresh, 255, cv2.THRESH_BINARY_INV if is_white_bg else cv2.THRESH_BINARY)
        
    median_intensity = float(np.median(gray))
    computed_canny_low = max(10, int(0.66 * median_intensity)) if canny_low == 25 else canny_low
    computed_canny_high = min(250, int(1.33 * median_intensity)) if canny_high == 120 else canny_high
    edges = cv2.Canny(gray, computed_canny_low, computed_canny_high)
    merged_mask = cv2.bitwise_or(thresh, edges)
    
    # 2. Morphological Closing: bridges dashed frames without bridging gutters
    kernel_w = max(3, (int(w_img * 0.006) | 1))
    kernel_h = max(3, (int(h_img * 0.006) | 1))
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_w, kernel_h))
    closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
    
    # 3. Outer Contour Extraction
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    raw_boxes: List[Dict[str, Any]] = []

    if contours:
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)

            # Filter full-canvas enclosing borders
            if w_box >= w_img * 0.98 and h_box >= h_img * 0.98:
                continue

            area = float(w_box * h_box)
            if area >= (img_area * 0.95) or area < effective_min_area:
                continue

            # Aspect ratio & minimum dimension filtering
            aspect = float(w_box) / float(max(1, h_box))
            min_dim_w = max(8, int(w_img * min_width_pct))
            min_dim_h = max(8, min_height_px)
            if aspect > max_aspect_ratio or aspect < min_aspect_ratio or w_box < min_dim_w or h_box < min_dim_h:
                continue

            # Polygonal approximation for diagonal/slanted comic panels
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            polygon_pts = [[int(pt[0][0]), int(pt[0][1])] for pt in approx] if len(approx) >= 3 else None

            raw_boxes.append({
                "x": x_box,
                "y": y_box,
                "w": w_box,
                "h": h_box,
                "width": w_box,
                "height": h_box,
                "polygon": polygon_pts,
                "confidence": 0.95,
                "label": "panel_manga_grid"
            })

    # If contours missed multi-column subpanels, run 2D projection fallback
    if len(raw_boxes) <= 1:
        pil_boxes = _detect_panels_grid_pil(
            gray_arr=gray,
            is_white_bg=is_white_bg,
            sensitivity=30.0,
            min_height_px=min_height_px,
            min_panel_area=effective_min_area,
            reading_flow=reading_flow
        )
        if len(pil_boxes) > len(raw_boxes):
            raw_boxes = pil_boxes

    # Sort in reading order (Manga: Top-to-Bottom, Right-to-Left within tier)
    if raw_boxes:
        tier_height = max(40, int(h_img * 0.15))
        if reading_flow == "right_to_left":
            raw_boxes.sort(key=lambda b: (b["y"] // tier_height, -b["x"]))
        else:
            raw_boxes.sort(key=lambda b: (b["y"] // tier_height, b["x"]))

    return raw_boxes


def _detect_panels_grid_pil(
    gray_arr: np.ndarray,
    is_white_bg: bool,
    sensitivity: float,
    min_height_px: int,
    min_panel_area: float = 5000.0,
    max_aspect_ratio: float = 10.0,
    min_aspect_ratio: float = 0.1,
    reading_flow: str = "right_to_left"
) -> List[Dict[str, Any]]:
    """
    2D Projection Tier & Column Decomposition:
    1. Splits page vertically into horizontal tier bands (Row gutters).
    2. Within each horizontal tier band, splits horizontally into columns (Column gutters).
    """
    h, w = gray_arr.shape[:2]
    img_area = float(w * h)
    effective_min_area = min(min_panel_area, max(200.0, img_area * 0.008))
    row_means = np.mean(gray_arr, axis=1)
    
    thresh_limit = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    thresh_limit = max(5, min(250, thresh_limit))
    
    is_content_row = (row_means < thresh_limit) if is_white_bg else (row_means > thresh_limit)
        
    # Bridge small gaps in rows
    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    bridge_max = max(4, int(h * 0.015))
    for i in range(len(smoothed_content)):
        if not smoothed_content[i]:
            gap_count += 1
        else:
            if 0 < gap_count < bridge_max:
                smoothed_content[i - gap_count : i] = True
            gap_count = 0
            
    # Find tier row ranges
    tier_ranges: List[Tuple[int, int]] = []
    in_tier = False
    start_y = 0
    
    for i in range(h):
        if smoothed_content[i] and not in_tier:
            in_tier = True
            start_y = i
        elif not smoothed_content[i] and in_tier:
            in_tier = False
            end_y = i
            if end_y - start_y >= min_height_px:
                tier_ranges.append((start_y, end_y))
    if in_tier:
        end_y = h
        if end_y - start_y >= min_height_px:
            tier_ranges.append((start_y, end_y))
            
    raw_boxes: List[Dict[str, Any]] = []

    # Within each tier, decompose into side-by-side columns
    for start_y, end_y in tier_ranges:
        tier_slice = gray_arr[start_y:end_y, :]
        if tier_slice.size == 0:
            continue
        
        tier_h = tier_slice.shape[0]
        tier_bg = float(np.median(tier_slice))
        is_tier_white = tier_bg >= 128.0
        
        col_stds = np.std(tier_slice, axis=0)
        if is_tier_white:
            col_bg_ratio = np.sum(tier_slice > min(245.0, tier_bg - 15.0), axis=0) / float(tier_h)
        else:
            col_bg_ratio = np.sum(tier_slice < max(15.0, tier_bg + 15.0), axis=0) / float(tier_h)
            
        col_diffs = np.sum(np.abs(np.diff(tier_slice.astype(float), axis=1)) > 15.0, axis=0)
        col_stroke_counts = np.pad(col_diffs, (0, 1), mode='edge')
        
        is_gutter_col = ((col_bg_ratio >= 0.70) | (col_stds <= 6.0)) & (col_stroke_counts <= max(2, int(tier_h * 0.01)))
        is_content_col = ~is_gutter_col
        
        # Bridge small column gaps within artwork
        smoothed_cols = np.copy(is_content_col)
        c_gap = 0
        col_bridge_max = max(4, int(w * 0.012))
        for j in range(len(smoothed_cols)):
            if not smoothed_cols[j]:
                c_gap += 1
            else:
                if 0 < c_gap < col_bridge_max:
                    smoothed_cols[j - c_gap : j] = True
                c_gap = 0

        # Extract column panel segments
        col_segments: List[Tuple[int, int]] = []
        in_col = False
        start_x = 0
        min_col_w = max(10, int(w * 0.08))

        for j in range(w):
            if smoothed_cols[j] and not in_col:
                in_col = True
                start_x = j
            elif not smoothed_cols[j] and in_col:
                in_col = False
                end_x = j
                if end_x - start_x >= min_col_w:
                    col_segments.append((start_x, end_x))
        if in_col:
            end_x = w
            if end_x - start_x >= min_col_w:
                col_segments.append((start_x, end_x))

        if not col_segments:
            col_segments = [(0, w)]

        for cx1, cx2 in col_segments:
            bw = cx2 - cx1
            bh = end_y - start_y
            area = float(bw * bh)
            aspect = float(bw) / float(max(1, bh))

            min_w_limit = max(8, int(w * 0.05))
            min_h_limit = max(8, int(h * 0.04))
            if area >= effective_min_area and min_aspect_ratio <= aspect <= max_aspect_ratio and bw >= min_w_limit and bh >= min_h_limit:
                raw_boxes.append({
                    "x": cx1,
                    "y": start_y,
                    "w": bw,
                    "h": bh,
                    "width": bw,
                    "height": bh,
                    "confidence": 0.90,
                    "label": "panel_tier_column"
                })

    return raw_boxes


# Backward-compatibility alias
_detect_panels_grid_cv = detect_manga_grid_panels

