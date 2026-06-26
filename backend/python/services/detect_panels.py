import os
import sys
import json
import argparse
import numpy as np
import logging
from PIL import Image

logger = logging.getLogger("sonikoma.services.detect_panels")

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

def run_cv_detection(image_path, sensitivity, bg_mode, min_width_pct, min_height_px, merge_threshold, aspect_ratio_str, canny_low=20, canny_high=100, close_kernel_size=15, auto_split=True):
    logger.info(f"[Panel Detection] Starting local CV detection on {image_path}")
    try:
        import cv2
        has_cv = True
    except ImportError:
        has_cv = False

    gray_img_ref = None
    if has_cv:
        img = cv2.imread(image_path)
        if img is None:
            return []
            
        h, w, c = img.shape
        if h == 0 or w == 0:
            return []
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gray_img_ref = gray
        
        # 1. Background color detection
        if bg_mode == "auto":
            # Sample slightly inside edges (e.g. 2% inset) to avoid outer black/colored border lines
            inset_y = max(1, int(h * 0.02))
            inset_x = max(1, int(w * 0.02))
            edge_samples = np.concatenate([
                gray[inset_y, :],
                gray[-inset_y - 1, :],
                gray[:, inset_x],
                gray[:, -inset_x - 1]
            ])
            median_bg = np.median(edge_samples)
            is_white_bg = median_bg > 127
        else:
            is_white_bg = bg_mode == "white"
            
        # 2. Threshold mask
        threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
        threshold_val = max(5, min(250, threshold_val))
        
        is_tall_strip = h / w > 1.2
        if auto_split and is_tall_strip:
            logger.info("[Panel Detection] Using Webtoon Gutter Slicing strategy for tall strip")
            # Calculate horizontal background match on the central region to ignore edge borders/noise
            margin = max(4, min(40, int(w * 0.05)))
            gray_center = gray[:, margin:-margin] if w > margin * 2 else gray
            w_center = gray_center.shape[1]

            # Gutter row definition: check if a high percentage of pixels match the background.
            # This is robust against vertical border lines or side noise.
            if is_white_bg:
                bg_pixel_count = np.sum(gray_center > threshold_val, axis=1)
            else:
                bg_pixel_count = np.sum(gray_center < threshold_val, axis=1)

            is_gutter_row = (bg_pixel_count / w_center) >= 0.95
            is_content_row = ~is_gutter_row

            # Join small content gaps to avoid splitting inside panels (dynamic threshold based on width)
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

            # Find panel y-ranges
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
                panel_slice = gray[start_y:end_y, :]
                col_vars = np.var(panel_slice, axis=0)
                col_means = np.mean(panel_slice, axis=0)

                if is_white_bg:
                    is_content_col = (col_vars >= 2) | (col_means < 240)
                else:
                    is_content_col = (col_vars >= 2) | (col_means > 15)

                # Scan for multiple columns (vertical sub-panels) inside this horizontal slice
                sub_panels = []
                in_sub = False
                start_x = 0

                # Smooth the column content mask to avoid splitting inside a panel due to small gaps
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
                    elif not smoothed_col[j] and in_sub:
                        in_sub = False
                        end_x = j
                        if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                            sub_panels.append((start_x, end_x))
                if in_sub:
                    end_x = w
                    if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                        sub_panels.append((start_x, end_x))

                if not sub_panels:
                    sub_panels = [(0, w)]

                for sx, ex in sub_panels:
                    pad_sx = max(0, sx - 8)
                    pad_ex = min(w, ex + 8)

                    # Enforce a minimum width by expanding the horizontal bounds, rather than discarding
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
        else:
            # 2. Threshold mask
            if is_white_bg:
                _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY_INV)
            else:
                _, thresh = cv2.threshold(gray, threshold_val, 255, cv2.THRESH_BINARY)
                
            # 3. Edges bitwise OR
            edges = cv2.Canny(gray, canny_low, canny_high)
            merged_mask = cv2.bitwise_or(thresh, edges)
            
            # 4. Morphological Close
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_kernel_size, close_kernel_size))
            closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
            
            # 5. Locate contours
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            raw_boxes = []
            if contours:
                for contour in contours:
                    x_box, y_box, w_box, h_box = cv2.boundingRect(contour)
                    raw_boxes.append({"x": x_box, "y": y_box, "w": w_box, "h": h_box})

            # 6. Gutter Detection Enhancement (Webtoon Optimized)
            logger.info("[Panel Detection] Running Gutter Scanner for Webtoon strip optimization...")
            row_vars = np.var(gray, axis=1)
            row_means = np.mean(gray, axis=1)

            if is_white_bg:
                is_gutter_row = (row_vars < 10) & (row_means > threshold_val)
            else:
                is_gutter_row = (row_vars < 10) & (row_means < threshold_val)

            refined_boxes = []
            for box in raw_boxes:
                bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
                if bh > min_height_px * 2:
                    box_gutters = is_gutter_row[by:by+bh]
                    gutter_indices = np.where(box_gutters)[0]
                    if len(gutter_indices) > 10:
                        pass
                refined_boxes.append(box)
            raw_boxes = refined_boxes
            
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
        gray_img_ref = gray_arr
        
        if bg_mode == "auto":
            # Sample slightly inside the corners/edges to avoid border lines
            inset_y = max(1, int(h * 0.02))
            inset_x = max(1, int(w * 0.02))
            samples = [
                gray_arr[inset_y, inset_x],
                gray_arr[inset_y, w - inset_x - 1],
                gray_arr[h - inset_y - 1, inset_x],
                gray_arr[h - inset_y - 1, w - inset_x - 1]
            ]
            median_bg = np.median(samples)
            is_white_bg = median_bg > 127
        else:
            is_white_bg = bg_mode == "white"

        threshold_val = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
        threshold_val = max(5, min(250, threshold_val))
            
        is_tall_strip = h / w > 1.2
        if auto_split and is_tall_strip:
            logger.info("[Panel Detection] Using Webtoon Gutter Slicing strategy for tall strip (PIL fallback)")
            # Calculate horizontal background match on the central region to ignore edge borders/noise
            margin = max(4, min(40, int(w * 0.05)))
            gray_center = gray_arr[:, margin:-margin] if w > margin * 2 else gray_arr
            w_center = gray_center.shape[1]

            # Gutter row definition: check if a high percentage of pixels match the background.
            # This is robust against vertical border lines or side noise.
            if is_white_bg:
                bg_pixel_count = np.sum(gray_center > threshold_val, axis=1)
            else:
                bg_pixel_count = np.sum(gray_center < threshold_val, axis=1)

            is_gutter_row = (bg_pixel_count / w_center) >= 0.95
            is_content_row = ~is_gutter_row

            # Join small content gaps (dynamic threshold based on width)
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

            # Find panel y-ranges
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
                col_vars = np.var(panel_slice, axis=0)
                col_means = np.mean(panel_slice, axis=0)

                if is_white_bg:
                    is_content_col = (col_vars >= 2) | (col_means < 240)
                else:
                    is_content_col = (col_vars >= 2) | (col_means > 15)

                # Scan for multiple columns (vertical sub-panels) inside this horizontal slice
                sub_panels = []
                in_sub = False
                start_x = 0

                # Smooth the column content mask to avoid splitting inside a panel due to small gaps
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
                    elif not smoothed_col[j] and in_sub:
                        in_sub = False
                        end_x = j
                        if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                            sub_panels.append((start_x, end_x))
                if in_sub:
                    end_x = w
                    if end_x - start_x >= max(10, int(w * min_width_pct * 0.5)):
                        sub_panels.append((start_x, end_x))

                if not sub_panels:
                    sub_panels = [(0, w)]

                for sx, ex in sub_panels:
                    pad_sx = max(0, sx - 8)
                    pad_ex = min(w, ex + 8)

                    # Enforce a minimum width by expanding the horizontal bounds, rather than discarding
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
        else:
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
    height_limit = min_height_px
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
            if gray_img_ref is not None:
                box_slice = gray_img_ref[by:by+bh, bx:bx+bw]
                if np.std(box_slice) < 5.0:
                    continue
        except Exception:
            pass

        filtered_boxes.append(box)
            
    # Merge
    merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, merge_threshold)
    
    # Adjust to aspect ratio & format response
    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    is_tall_strip = h / w > 1.2
    for box in merged_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        
        if auto_split and is_tall_strip:
            pad_by = max(0, by - 8)
            pad_ey = min(h, by + bh + 8)
            by = pad_by
            bh = pad_ey - pad_by
            
        x, y, w_box, h_box = adjust_to_aspect_ratio(
            bx, by, bw, bh, w, h, aspect_ratio_str
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