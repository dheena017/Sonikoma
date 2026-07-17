"""
backend/app/services/image/detect_panels.py
─────────────────────────────────────────────────────────────────────────────
Lightweight facade coordinator for panel detection. Exposes run_cv_detection
while delegating core algorithms to sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import json
import argparse
import logging
from typing import List, Dict, Optional
import numpy as np
from PIL import Image

# Import helper sub-modules
from services.image.panel_box_utils import (
    adjust_to_aspect_ratio,
    merge_overlapping_boxes
)
from services.image.panel_webtoon_detect import (
    _detect_bg_color_and_threshold,
    _detect_panels_webtoon
)
from services.image.panel_grid_detect import (
    _detect_panels_grid_cv,
    _detect_panels_grid_pil
)
from services.image.panel_image_utils import (
    trim_solid_borders,
    _filter_solid_noise
)

logger = logging.getLogger("sonikoma.services.detect_panels")


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
    """
    logger.info(f"[Panel Detection] Starting local panel detection on {image_path}")
    
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

    # Dynamic Parameter Scaling
    ref_area = 1500.0 * 1500.0
    img_area = float(orig_w * orig_h)
    scale_factor = (img_area / ref_area) ** 0.5

    scaled_min_height_px = max(15, min(120, int(min_height_px * scale_factor)))
    scaled_min_width_pct = max(0.05, min(0.25, min_width_pct * (0.5 + 0.5 * scale_factor)))
    scaled_close_kernel = max(3, min(40, int(close_kernel_size * scale_factor)))

    # Speech Bubble Protection (OCR)
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

    # YOLO Speech Bubble Bounds
    try:
        from media.image.segmentation_engine import get_yolo_model
        yolo_model = get_yolo_model()
        if yolo_model is not None:
            results = yolo_model.predict(image_path, conf=0.25, verbose=False)
            if results and len(results) > 0:
                result = results[0]
                if result.boxes is not None:
                    yolo_count = 0
                    for box_instance in result.boxes:
                        coords = box_instance.xyxy[0].cpu().numpy()
                        bx1, by1, bx2, by2 = coords
                        ocr_boxes.append({
                            "x": int(bx1),
                            "y": int(by1),
                            "w": int(bx2 - bx1),
                            "h": int(by2 - by1)
                        })
                        yolo_count += 1
                    logger.info(f"[Panel Detection] Successfully extracted {yolo_count} YOLO speech bubble bounds for Speech Bubble Protection.")
    except Exception as e:
        logger.warning(f"[Panel Detection] Failed to retrieve YOLO bounds for speech bubble protection: {e}")

    # Global Margin Trimming
    crop_x, crop_y, crop_w, crop_h = trim_solid_borders(gray_arr, 0, 0, orig_w, orig_h, bg_mode)

    w, h = orig_w, orig_h
    if crop_w > 0 and crop_h > 0 and (crop_w < orig_w or crop_h < orig_h):
        logger.info(f"[Panel Detection] Trimming global solid margins: x={crop_x}, y={crop_y}, w={crop_w}, h={crop_h}")
        gray_arr_processed = gray_arr[crop_y : crop_y + crop_h, crop_x : crop_x + crop_w]
        w, h = crop_w, crop_h

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

    # Background detection
    is_white_bg, threshold_val = _detect_bg_color_and_threshold(gray_arr_processed, bg_mode, sensitivity)
    is_tall_strip = (h / max(1, w) > 1.2)

    passes = [False, True] if has_cv else [False]
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

        min_w = w * scaled_min_width_pct
        filtered_boxes = _filter_solid_noise(raw_boxes, gray_arr_processed, min_w, scaled_min_height_px, auto_split)
        merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, merge_threshold)

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
            if tw >= 15 and th >= 15:
                trimmed_boxes.append({"x": tx, "y": ty, "w": tw, "h": th})
        merged_boxes = trimmed_boxes

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

    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    
    for box in merged_boxes:
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
        
        if auto_split and is_tall_strip:
            pad_by = max(0, by - 8)
            pad_ey = min(h, by + bh + 8)
            by = pad_by
            bh = pad_ey - pad_by
            
        bx += crop_x
        by += crop_y

        x, y, w_box, h_box = adjust_to_aspect_ratio(
            bx, by, bw, bh, orig_w, orig_h, aspect_ratio_str
        )
        
        if x < 0 or y < 0 or w_box <= 0 or h_box <= 0 or (x + w_box) > orig_w or (y + h_box) > orig_h:
            raise ValueError(
                f"Panel coordinates out of bounds: x={x}, y={y}, w_box={w_box}, h_box={h_box} for image of size {orig_w}x{orig_h}"
            )
        
        safe_orig_h = max(1, orig_h)
        safe_orig_w = max(1, orig_w)
        crop_top = (y / safe_orig_h) * 100
        crop_bottom = ((safe_orig_h - (y + h_box)) / safe_orig_h) * 100
        crop_left = (x / safe_orig_w) * 100
        crop_right = ((safe_orig_w - (x + w_box)) / safe_orig_w) * 100
        
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