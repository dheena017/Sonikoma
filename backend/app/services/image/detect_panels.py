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
from typing import List, Dict, Optional, Any, Union
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_CV = True
except ImportError:
    cv2 = None  # type: ignore
    HAS_CV = False


# Import helper sub-modules
from services.image.utils.panel_box_utils import (
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
from services.image.utils.panel_image_utils import (
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
    auto_split: bool = True,
    padding_px: int = 10,
    use_yolo: bool = False,
    yolo_conf: float = 0.20,
    min_panel_area: float = 5000.0
) -> List[Dict[str, Any]]:

    """
    Main orchestration function for panel detection. Loads the image, runs background
    detection, routes to the appropriate detection strategy (Webtoon Slicing vs. Grid Contours),
    performs YOLO deep learning box fusion, noise filtering, overlap merging, padding, and scaling.
    """
    logger.info(f"[Panel Detection] Starting local panel detection on {image_path} (use_yolo={use_yolo})")
    
    has_cv = HAS_CV and cv2 is not None

    gray_arr: Optional[np.ndarray] = None
    orig_w: int = 0
    orig_h: int = 0

    if has_cv and cv2 is not None:
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
    aspect_strip = float(orig_h) / float(max(1, orig_w))
    if aspect_strip > 1.5:
        scale_factor = max(0.5, min(2.0, float(orig_w) / 1200.0))
    else:
        scale_factor = max(0.5, min(2.0, (img_area / ref_area) ** 0.5))

    scaled_min_height_px = max(15, min(120, int(min_height_px * scale_factor)))
    scaled_min_width_pct = max(0.05, min(0.25, min_width_pct * (0.5 + 0.5 * scale_factor)))
    scaled_close_kernel = max(3, min(40, int(close_kernel_size * scale_factor)))

    # Speech Bubble Protection (OCR)
    ocr_boxes: List[Dict[str, int]] = []
    yolo_panel_candidates: List[Dict[str, Union[int, float]]] = []

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
            if has_cv and cv2 is not None:
                bx, by, bw, bh = cv2.boundingRect(pts)
            else:
                xs = [pt[0] for pt in res["box"]]
                ys = [pt[1] for pt in res["box"]]
                bx, by, bw, bh = min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)
            ocr_boxes.append({"x": bx, "y": by, "w": bw, "h": bh})
    except Exception as e:
        logger.warning(f"[Panel Detection] Failed to retrieve OCR bounds for speech bubble protection: {e}")

    # YOLO AI Object & Speech Bubble Detection + Panel Candidate Extraction
    if use_yolo:
        try:
            from providers.vision.yolo import get_yolo_model
            yolo_model = get_yolo_model()
            if yolo_model is not None:
                raw_results = yolo_model.predict(image_path, conf=yolo_conf, verbose=False)
                results = list(raw_results) if raw_results is not None else []
                if results:
                    result = results[0]
                    boxes = getattr(result, "boxes", None)
                    if boxes is not None:
                        yolo_count = 0
                        min_w_px = int(orig_w * scaled_min_width_pct)
                        for box_instance in boxes:  # type: ignore
                            coords = box_instance.xyxy[0].cpu().numpy()
                            conf_score = float(box_instance.conf[0].cpu().numpy()) if box_instance.conf is not None else 0.8
                            bx1, by1, bx2, by2 = coords
                            bx, by, bw, bh = int(bx1), int(by1), int(bx2 - bx1), int(by2 - by1)
                            
                            # Add to speech bubble protection bounds if it's a bubble/text, or if class is not specified
                            cls_id = int(box_instance.cls[0].cpu().numpy()) if hasattr(box_instance, "cls") and box_instance.cls is not None else 0
                            cls_name = yolo_model.names.get(cls_id, "").lower() if hasattr(yolo_model, "names") and yolo_model.names is not None else ""

                            is_bubble = "bubble" in cls_name or "balloon" in cls_name or "text" in cls_name or "caption" in cls_name or not cls_name
                            is_panel = "frame" in cls_name or "panel" in cls_name

                            if is_bubble:
                                ocr_boxes.append({"x": bx, "y": by, "w": bw, "h": bh})
                            
                            # Add to YOLO panel candidates ONLY if it is classified as a frame/panel
                            if is_panel and bw >= min_w_px and bh >= scaled_min_height_px:
                                yolo_panel_candidates.append({  # type: ignore
                                    "x": bx, "y": by, "w": bw, "h": bh,
                                    "confidence": conf_score
                                })
                            yolo_count += 1
                        logger.info(f"[Panel Detection] Extracted {yolo_count} YOLO protection bounds & {len(yolo_panel_candidates)} YOLO panel candidates.")
        except Exception as e:
            logger.warning(f"[Panel Detection] Failed to retrieve YOLO bounds for panel detection: {e}")

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
    is_white_bg, threshold_val, median_bg = _detect_bg_color_and_threshold(gray_arr_processed, bg_mode, sensitivity)
    is_tall_strip = (h / max(1, w) > 1.7)

    passes = [False] if (auto_split and is_tall_strip) else ([False, True] if has_cv else [False])
    raw_boxes: List[Dict[str, Any]] = []
    merged_boxes: List[Dict[str, Any]] = []

    for high_sensitivity in passes:
        if auto_split and is_tall_strip:
            logger.info(f"[Panel Detection] Running Webtoon Slicing strategy (high_sensitivity={high_sensitivity})")
            raw_boxes = _detect_panels_webtoon(
                gray_arr_processed, is_white_bg, threshold_val, scaled_min_height_px, scaled_min_width_pct, ocr_boxes, median_bg, sensitivity
            )
        else:
            logger.info(f"[Panel Detection] Running Grid strategy (high_sensitivity={high_sensitivity})")
            if has_cv:
                raw_boxes = _detect_panels_grid_cv(gray_arr_processed, is_white_bg, threshold_val, canny_low, canny_high, scaled_close_kernel, high_sensitivity, min_panel_area=min_panel_area)
            else:
                raw_boxes = _detect_panels_grid_pil(gray_arr_processed, is_white_bg, sensitivity, scaled_min_height_px, min_panel_area=min_panel_area)

        # Fuse YOLO panel candidates with OpenCV raw boxes
        if use_yolo and yolo_panel_candidates:
            for yb in yolo_panel_candidates:
                yx = max(0, yb["x"] - crop_x)
                yy = max(0, yb["y"] - crop_y)
                yw, yh = yb["w"], yb["h"]
                
                matched = False
                for rb in raw_boxes:
                    rx, ry, rw, rh = rb["x"], rb["y"], rb["w"], rb["h"]
                    ix1, iy1 = max(rx, yx), max(ry, yy)
                    ix2, iy2 = min(rx + rw, yx + yw), min(ry + rh, yy + yh)
                    if ix2 > ix1 and iy2 > iy1:
                        inter_area = (ix2 - ix1) * (iy2 - iy1)
                        min_area = min(rw * rh, yw * yh)
                        if min_area > 0 and (inter_area / min_area) > 0.4:
                            matched = True
                            rb["yolo_boosted"] = True
                            break
                if not matched:
                    raw_boxes.append({
                        "x": yx, "y": yy, "w": yw, "h": yh,
                        "yolo_boosted": True
                    })

        min_w = w * scaled_min_width_pct
        effective_merge_thresh = 0 if (auto_split and is_tall_strip) else merge_threshold
        filtered_boxes = _filter_solid_noise(raw_boxes, gray_arr_processed, min_w, scaled_min_height_px, auto_split, min_panel_area=min_panel_area)
        merged_boxes = merge_overlapping_boxes(filtered_boxes, w, h, effective_merge_thresh)

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
        merged_boxes = merge_overlapping_boxes(trimmed_boxes, w, h, effective_merge_thresh)

        if len(merged_boxes) > 0:
            has_irregular = False
            if not (auto_split and is_tall_strip):
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

    is_full_frame_only = (
        len(merged_boxes) == 0 or
        (len(merged_boxes) == 1 and merged_boxes[0]["w"] >= int(w * 0.95) and merged_boxes[0]["h"] >= int(h * 0.95))
    )

    if is_full_frame_only:
        logger.info(f"[Panel Detection] 0 panels or single full-frame box detected; applying vertical fallback segment slicing (is_tall_strip={is_tall_strip})...")
        merged_boxes = []
        if is_tall_strip:
            num_segments = max(2, int(round(h / max(1.0, w * 0.9))))
        else:
            num_segments = 2 if h >= w else 3

        seg_h = int(h / num_segments)
        for seg_i in range(num_segments):
            sy = seg_i * seg_h
            sh = int(h - sy) if seg_i == num_segments - 1 else seg_h
            merged_boxes.append({"x": 0, "y": sy, "w": w, "h": sh})

    # Speech Bubble / OCR Box Expansion & Panel Snapping
    # Smartly groups floating speech bubbles directly associated with a panel into that panel’s bounding box
    if ocr_boxes and len(merged_boxes) > 0:
        expanded_boxes = []
        for box in merged_boxes:
            bx1, by1 = box["x"], box["y"]
            bx2, by2 = box["x"] + box["w"], box["y"] + box["h"]
            
            for ob in ocr_boxes:
                ox1, oy1 = ob["x"], ob["y"]
                ox2, oy2 = ob["x"] + ob["w"], ob["y"] + ob["h"]
                
                # Check horizontal overlap
                h_overlap = max(0, min(bx2, ox2) - max(bx1, ox1))
                if h_overlap > 0:
                    # Check vertical distance (close to the panel vertically, e.g. within 150px or 40% of panel height)
                    v_dist = min(abs(oy2 - by1), abs(by2 - oy1))
                    is_adjacent = v_dist < min(150, max(50, int((by2 - by1) * 0.40)))
                    
                    # Also check if it's already overlapping vertically
                    v_overlap = max(0, min(by2, oy2) - max(by1, oy1))
                    
                    if is_adjacent or v_overlap > 0:
                        # Associate and expand the panel box to contain the bubble
                        bx1 = min(bx1, ox1)
                        by1 = min(by1, oy1)
                        bx2 = max(bx2, ox2)
                        by2 = max(by2, oy2)
            
            # Constrain to image dimensions
            bx1 = max(0, bx1)
            by1 = max(0, by1)
            bx2 = min(w, bx2)
            by2 = min(h, by2)
            
            expanded_boxes.append({
                "x": bx1,
                "y": by1,
                "w": bx2 - bx1,
                "h": by2 - by1
            })
        merged_boxes = expanded_boxes

    final_panels = []
    logger.info(f"[Panel Detection] Found {len(merged_boxes)} panels after merging and filtering.")
    
    orig_area = max(1, orig_w * orig_h)
    
    for idx, box in enumerate(merged_boxes):
        bx, by, bw, bh = box["x"], box["y"], box["w"], box["h"]
            
        bx += crop_x
        by += crop_y

        if padding_px > 0:
            pad_bx = max(0, bx - padding_px)
            pad_by = max(0, by - padding_px)
            pad_bw = min(orig_w - pad_bx, bw + (padding_px * 2))
            pad_bh = min(orig_h - pad_by, bh + (padding_px * 2))
            bx, by, bw, bh = pad_bx, pad_by, pad_bw, pad_bh

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
        
        area = w_box * h_box
        area_pct = round((area / orig_area) * 100.0, 2)
        aspect = float(w_box) / float(h_box) if h_box > 0 else 1.0
        aspect_ratio_val = round(aspect, 2)

        if aspect >= 2.5:
            aspect_label = "Wide Banner"
        elif aspect >= 1.4:
            aspect_label = "Landscape (16:9)"
        elif aspect >= 1.15:
            aspect_label = "4:3 Standard"
        elif aspect >= 0.85:
            aspect_label = "1:1 Square"
        elif aspect >= 0.6:
            aspect_label = "3:4 Portrait"
        else:
            aspect_label = "Vertical Strip"

        is_header = y < min(250, int(orig_h * 0.02)) and aspect >= 2.5
        if is_header:
            panel_type = "Wide Banner / Header"
        elif area_pct >= 80.0:
            panel_type = "Full Page / Splash"
        elif aspect < 0.5:
            panel_type = "Vertical Strip Panel"
        elif aspect > 2.0:
            panel_type = "Horizontal Panoramic Panel"
        else:
            panel_type = "Standard Storyboard Panel"

        confidence = 0.95 if (w_box > 40 and h_box > 40 and area_pct > 0.5) else 0.80

        final_panels.append({
            "id": f"panel-{idx + 1}",
            "index": idx + 1,
            "x": x,
            "y": y,
            "width": w_box,
            "height": h_box,
            "cropTop": round(max(0.0, min(100.0, crop_top)), 2),
            "cropBottom": round(max(0.0, min(100.0, crop_bottom)), 2),
            "cropLeft": round(max(0.0, min(100.0, crop_left)), 2),
            "cropRight": round(max(0.0, min(100.0, crop_right)), 2),
            "area": area,
            "areaPct": area_pct,
            "aspectRatio": aspect_ratio_val,
            "aspectRatioLabel": aspect_label,
            "panelType": panel_type,
            "confidence": confidence,
            "isHeader": is_header,
        })
        
    sorted_panels = sorted(
        final_panels,
        key=lambda b: (round(b.get("cropTop", 0.0) / 4.0), b.get("cropLeft", 0.0))
    )
    
    unique_panels = []
    for panel in sorted_panels:
        is_dup = False
        py1, py2 = panel["y"], panel["y"] + panel["height"]
        p_area = max(1, panel["height"] * panel["width"])
        
        for existing in unique_panels:
            ey1, ey2 = existing["y"], existing["y"] + existing["height"]
            e_area = max(1, existing["height"] * existing["width"])
            
            # Calculate vertical overlap
            y_inter = max(0, min(py2, ey2) - max(py1, ey1))
            min_h = min(panel["height"], existing["height"])
            overlap_ratio = y_inter / float(min_h) if min_h > 0 else 0.0
            
            dt = abs(panel["cropTop"] - existing["cropTop"])
            db = abs(panel["cropBottom"] - existing["cropBottom"])
            
            if (dt < 4.0 and db < 4.0) or (overlap_ratio > 0.70):
                is_dup = True
                break
                
        if not is_dup:
            unique_panels.append(panel)

    for idx, panel in enumerate(unique_panels):
        panel["id"] = f"panel-{idx + 1}"
        panel["index"] = idx + 1

    return unique_panels


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
    parser.add_argument("--min_panel_area", type=float, default=5000.0, help="Minimum area threshold suitable for comic panels")
    
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
            auto_split=args.auto_split,
            min_panel_area=args.min_panel_area
        )
        print(json.dumps({"success": True, "panels": panels, "message": f"Detected {len(panels)} panels."}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()