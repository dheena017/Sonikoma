import os
import sys
import json
import argparse
import numpy as np
from PIL import Image

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

def run_cv_detection(image_path, sensitivity, bg_mode, min_width_pct, min_height_px, merge_threshold, aspect_ratio_str):
    try:
        import cv2
        has_cv = True
    except ImportError:
        has_cv = False

    if has_cv:
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        h, w, c = img.shape
        if h == 0 or w == 0:
            return []
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 1. Background color detection
        if bg_mode == "auto":
            corner_samples = [gray[0, 0], gray[0, w-1], gray[h-1, 0], gray[h-1, w-1]]
            median_bg = np.median(corner_samples)
            is_white_bg = median_bg > 127
        else:
            is_white_bg = bg_mode == "white"
            
        # 2. Threshold mask
        threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
        threshold_val = max(5, min(250, threshold_val))
        
        if is_white_bg:
            _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY_INV)
        else:
            _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY)
            
        # 3. Edges bitwise OR
        edges = cv2.Canny(gray, 20, 100)
        merged_mask = cv2.bitwise_or(thresh, edges)
        
        # 4. Morphological Close
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
        
        # 5. Locate contours
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        raw_boxes = []
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)
            raw_boxes.append({"x": x_box, "y": y_box, "w": w_box, "h": h_box})
            
    else:
        # PIL/NumPy Fallback
        try:
            pil_img = Image.open(image_path)
        except Exception:
            return []
            
        w, h = pil_img.size
        if w == 0 or h == 0:
            return []
            
        gray_img = pil_img.convert("L")
        gray_arr = np.array(gray_img)
        
        if bg_mode == "auto":
            corner_samples = [gray_arr[0, 0], gray_arr[0, w-1], gray_arr[h-1, 0], gray_arr[h-1, w-1]]
            median_bg = np.median(corner_samples)
            is_white_bg = median_bg > 127
        else:
            is_white_bg = bg_mode == "white"
            
        # Calculate horizontal projection profile
        row_means = np.mean(gray_arr, axis=1)
        
        # Determine content rows
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
        panels = []
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
                
        raw_boxes = []
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

    # Noise filter + Overlap Merge + Aspect Ratio adjust
    filtered_boxes = []
    min_w = w * min_width_pct
    for box in raw_boxes:
        if box["w"] >= min_w and box["h"] >= min_height_px:
            filtered_boxes.append(box)
            
    # Merge
    merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, merge_threshold)
    
    # Adjust to aspect ratio & format response
    final_panels = []
    for box in merged_boxes:
        x, y, w_box, h_box = adjust_to_aspect_ratio(
            box["x"], box["y"], box["w"], box["h"], w, h, aspect_ratio_str
        )
        
        crop_top = (y / h) * 100
        crop_bottom = ((h - (y + h_box)) / h) * 100
        crop_left = (x / w) * 100
        crop_right = ((w - (x + w_box)) / w) * 100
        
        final_panels.append({
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
            "width": int(w_box),
            "height": int(h_box),
            "area": int(w_box * h_box)
        })
        
    # Fallback to equidistant panels if empty
    if not final_panels:
        for i in range(3):
            top_pct = i * 33.3
            bot_pct = 100.0 - (i + 1) * 33.3
            final_panels.append({
                "cropTop": round(top_pct, 2),
                "cropBottom": round(bot_pct, 2),
                "cropLeft": 0.0,
                "cropRight": 0.0,
                "width": w,
                "height": int(h / 3),
                "area": int((w * h) / 3)
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
            aspect_ratio_str=args.aspect_ratio
        )
        print(json.dumps({"success": True, "panels": panels, "message": f"Detected {len(panels)} panels."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
