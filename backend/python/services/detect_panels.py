import os
import sys
import json
import argparse
import numpy as np
import logging
from PIL import Image

logger = logging.getLogger("anivox.services.detect_panels")

def adjust_to_aspect_ratio(x, y, w_box, h_box, w_img, h_img, aspect_ratio_str):
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

def merge_overlapping_boxes(boxes, w_img, h_img, merge_threshold):
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
                
                # Check horizontal overlap and vertical proximity
                x_overlap = not (x2_a < x1_b or x2_b < x1_a)
                y_dist = max(0, y1_b - y2_a) if y1_b >= y2_a else max(0, y1_a - y2_b)
                
                if x_overlap and y_dist <= merge_threshold:
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

def run_cv_detection(image_path, sensitivity, bg_mode, min_width_pct, min_height_px, merge_threshold, aspect_ratio_str, canny_low=20, canny_high=100, close_kernel_size=15):
    logger.info(f"[Panel Detection] Starting local CV detection on {image_path}")
    try:
        import cv2
        has_cv = True
    except ImportError:
        has_cv = False

    # Load image and get dimensions
    if has_cv:
        img = cv2.imread(image_path)
        if img is None:
            return []
        h, w, c = img.shape
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        try:
            pil_img = Image.open(image_path)
        except Exception:
            return []
        w, h = pil_img.size
        gray_img = pil_img.convert("L")
        gray = np.array(gray_img)

    if h == 0 or w == 0:
        return []

    # Calculate scale factor relative to 800px standard width
    scale = w / 800.0
    
    # Scale user options based on image size to support low-res strips
    scaled_min_height = max(10, int(min_height_px * scale))
    scaled_merge_threshold = max(2, int(merge_threshold * scale))
    scaled_min_gutter = max(2, int(5 * scale))

    # Map sensitivity to variance threshold (sensitivity = 30 -> variance threshold = 300)
    var_threshold = max(50, min(1000, sensitivity * 10))

    # Auto-adjust Canny thresholds if overall image contrast is very low
    std_val = np.std(gray)
    if std_val < 30:
        canny_low = max(5, int(canny_low * 0.5))
        canny_high = max(20, int(canny_high * 0.6))
        logger.info(f"[Panel Detection] Low contrast detected ({std_val:.1f}). Adjusted Canny: low={canny_low}, high={canny_high}")

    logger.info(f"[Panel Detection] Width={w}, Height={h}, Scale={scale:.4f}, min_height={scaled_min_height}, merge_thresh={scaled_merge_threshold}, min_gutter={scaled_min_gutter}, var_thresh={var_threshold}")

    raw_boxes = []
    min_w = w * min_width_pct

    # Determine layout type: tall strip (webtoon) vs standard page (manga page)
    page_ratio = h / w
    is_tall_strip = page_ratio > 1.5

    # Strategy A: Contour-based detection (Only available if OpenCV is installed)
    run_contours = has_cv
    if run_contours:
        logger.info(f"[Panel Detection] Running OpenCV contour scanner (Canny={canny_low}-{canny_high}, Kernel={close_kernel_size})")
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, canny_low, canny_high)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_kernel_size, close_kernel_size))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        contour_boxes = []
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)
            if w_box >= min_w and h_box >= scaled_min_height:
                # Exclude contours that occupy the entire image (page border)
                if w_box > w * 0.98 and h_box > h * 0.98:
                    continue
                contour_boxes.append({"x": x_box, "y": y_box, "w": w_box, "h": h_box})
        
        logger.info(f"[Panel Detection] Contour scanner found {len(contour_boxes)} boxes.")
        raw_boxes.extend(contour_boxes)

    # Strategy B: Background-Aware Gutter Detection
    # For tall strips, we ALWAYS run it to ensure borderless or soft/gradient panels are captured.
    # For standard pages, we only run it as a fallback if no contours were found.
    run_gutter = (not run_contours) or is_tall_strip or (len(raw_boxes) == 0)

    if run_gutter:
        logger.info(f"[Panel Detection] Running background-aware gutter split (BG Mode={bg_mode}, Sensitivity={sensitivity})")
        
        # Estimate/Determine Background Color
        if bg_mode == "white":
            bg_color = 255.0
        elif bg_mode == "black":
            bg_color = 0.0
        else:  # "auto"
            # Sample 1% width of both left and right edges over the entire height
            edge_w = max(1, int(w * 0.01))
            edge_pixels = np.concatenate([gray[:, :edge_w], gray[:, -edge_w:]], axis=None)
            bg_color = np.median(edge_pixels)
            
        color_threshold = max(10, min(60, sensitivity * 0.8))
        row_vars = np.var(gray, axis=1)
        row_means = np.mean(gray, axis=1)

        # Gutter condition: low variance (flat row) AND average color is close to page background color
        is_gutter = (row_vars < var_threshold) & (np.abs(row_means - bg_color) < color_threshold)

        gutter_blocks = []
        in_gutter = False
        start_y = 0
        for y in range(h):
            if is_gutter[y] and not in_gutter:
                in_gutter = True
                start_y = y
            elif not is_gutter[y] and in_gutter:
                in_gutter = False
                end_y = y - 1
                if (end_y - start_y + 1) >= scaled_min_gutter:
                    gutter_blocks.append((start_y, end_y))
        if in_gutter:
            end_y = h - 1
            if (end_y - start_y + 1) >= scaled_min_gutter:
                gutter_blocks.append((start_y, end_y))

        panel_candidates = []
        current_y = 0
        for g_start, g_end in gutter_blocks:
            if g_start > current_y:
                panel_h = g_start - current_y
                if panel_h >= scaled_min_height:
                    panel_candidates.append((current_y, g_start - 1))
            current_y = g_end + 1
        if current_y < h:
            panel_h = h - current_y
            if panel_h >= scaled_min_height:
                panel_candidates.append((current_y, h - 1))

        gutter_boxes = []
        for start_y, end_y in panel_candidates:
            panel_slice = gray[start_y:end_y+1, :]
            col_vars = np.var(panel_slice, axis=0)
            col_means = np.mean(panel_slice, axis=0)
            # Content columns: variance is > 10 OR mean color differs from background color
            content_cols = np.where((col_vars > 10) | (np.abs(col_means - bg_color) > 10))[0]
            if len(content_cols) > 0:
                start_x = max(0, int(content_cols[0]))
                end_x = min(w, int(content_cols[-1]) + 1)
            else:
                start_x = 0
                end_x = w
                
            gutter_boxes.append({
                "x": start_x,
                "y": start_y,
                "w": end_x - start_x,
                "h": end_y - start_y + 1
            })

        logger.info(f"[Panel Detection] Gutter split found {len(gutter_boxes)} boxes.")
        raw_boxes.extend(gutter_boxes)

    # Filter out boxes that don't satisfy the minimum height/width ratio constraints
    filtered_boxes = []
    for box in raw_boxes:
        if box["w"] >= min_w and box["h"] >= scaled_min_height:
            filtered_boxes.append(box)

    # Merge overlapping or close proximity boxes
    merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, scaled_merge_threshold)

    # Adjust to aspect ratio & format response
    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    for box in merged_boxes:
        x, y, w_box, h_box = adjust_to_aspect_ratio(
            box["x"], box["y"], box["w"], box["h"], w, h, aspect_ratio_str
        )
        
        crop_top = (y / h) * 100
        crop_bottom = ((h - (y + h_box)) / h) * 100
        crop_left = (x / w) * 100
        crop_right = ((w - (x + w_box)) / w) * 100

        # Calculate visual metadata metrics for panel analysis
        panel_slice = gray[y : y + h_box, x : x + w_box]
        
        if panel_slice.size > 0:
            panel_brightness = float(np.mean(panel_slice))
            panel_contrast = float(np.std(panel_slice))
            
            # Detail score (edge density percentage inside panel)
            if has_cv:
                panel_edges = cv2.Canny(panel_slice, canny_low, canny_high)
                edge_pixels = np.sum(panel_edges > 0)
                panel_detail = float((edge_pixels / panel_slice.size) * 100)
            else:
                panel_detail = 0.0
                
            # Border type detection (based on border pixels luminance difference from background)
            border_pixels = []
            if h_box > 4 and w_box > 4:
                border_pixels.extend(panel_slice[0, :])
                border_pixels.extend(panel_slice[-1, :])
                border_pixels.extend(panel_slice[:, 0])
                border_pixels.extend(panel_slice[:, -1])
                
                # Retrieve bg_color if available
                ref_bg = 255.0
                if 'bg_color' in locals():
                    ref_bg = bg_color
                
                if ref_bg > 127:  # Light background, borders are dark (gray < 120)
                    has_border = np.mean(np.array(border_pixels) < 120) > 0.25
                else:  # Dark background, borders are light (gray > 130)
                    has_border = np.mean(np.array(border_pixels) > 130) > 0.25
                border_type = "bordered" if has_border else "borderless"
            else:
                border_type = "borderless"
        else:
            panel_brightness = 127.0
            panel_contrast = 0.0
            panel_detail = 0.0
            border_type = "borderless"
        
        final_panels.append({
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
            "width": int(w_box),
            "height": int(h_box),
            "area": int(w_box * h_box),
            "brightness": round(panel_brightness, 1),
            "contrast": round(panel_contrast, 1),
            "detailScore": round(panel_detail, 2),
            "borderType": border_type
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
            close_kernel_size=args.close_kernel_size
        )
        print(json.dumps({"success": True, "panels": panels, "message": f"Detected {len(panels)} panels."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
