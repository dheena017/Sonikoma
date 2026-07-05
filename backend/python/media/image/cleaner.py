import os
import sys
import argparse
import logging
import numpy as np
from PIL import Image, ImageFilter

logger = logging.getLogger("sonikoma.services.cleaner")

try:
    import cv2
    has_cv = True
except ImportError:
    has_cv = False

from typing import List, Optional

def remove_speech_bubbles(
    image_path: str,
    output_path: str,
    method: str = 'inpaint',
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = 'all',
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0
) -> bool:
    """
    Detects and erases dialogue speech bubbles from comic images.
    Returns True if bubbles were detected, False otherwise.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

    logger.info(f"[Speech Bubbles] Processing image: {image_path} | method: {method}")

    if not has_cv:
        # Simple PIL-based fallback
        img = Image.open(image_path).convert("RGB")
        img.save(output_path)
        return False

    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not load image file: {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape

    # Adaptive thresholds based on sensitivity
    bright_thresh = 255 - (sensitivity * 0.8)
    dark_thresh = sensitivity * 1.7

    _, bright_mask = cv2.threshold(gray, bright_thresh, 255, cv2.THRESH_BINARY)
    _, dark_mask = cv2.threshold(gray, dark_thresh, 255, cv2.THRESH_BINARY_INV)

    mask = np.zeros_like(gray)
    bubble_detected = False

    # 1. White / Custom Color speech bubbles detection
    if detection_style in ("all", "white_only"):
        if target_color is not None:
            # target_color is in BGR format
            lower_bound = np.array([max(0, c - color_tolerance) for c in target_color], dtype=np.uint8)
            upper_bound = np.array([min(255, c + color_tolerance) for c in target_color], dtype=np.uint8)
            detection_mask = cv2.inRange(image, lower_bound, upper_bound)
        else:
            detection_mask = bright_mask

        contours, _ = cv2.findContours(detection_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            area = cv2.contourArea(contour)
            # Safe area constraints to prevent clearing entire illustrations
            if (width * height) * 0.001 < area < (width * height) * 0.60:
                c_mask = np.zeros_like(gray)
                cv2.drawContours(c_mask, [contour], -1, 255, -1)
                text_intersect = cv2.bitwise_and(c_mask, dark_mask)
                # Scaled threshold matching area to reject shadows/border lines
                min_text_pixels = max(15, int(area * 0.0005))
                if np.count_nonzero(text_intersect) > min_text_pixels:
                    cv2.drawContours(mask, [contour], -1, 255, -1)
                    bubble_detected = True

    # 2. Floating borderless text detection (words/narration boxes)
    if detection_style in ("all", "text_only"):
        kernel_size = max(5, int(min(width, height) * 0.012) | 1)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
        closed_dark = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, kernel)
        text_contours, _ = cv2.findContours(closed_dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        region_mask = np.zeros_like(gray)
        for tc in text_contours:
            tx, ty, tw, th = cv2.boundingRect(tc)
            t_area = cv2.contourArea(tc)
            if (width * height) * 0.0001 < t_area < (width * height) * 0.25:
                if tw > 6 and th > 6:
                    cv2.drawContours(region_mask, [tc], -1, 255, -1)
                    
        # Intersect region masks with dark letter strokes to build a tight text mask
        tight_text_strokes = cv2.bitwise_and(region_mask, dark_mask)
        if np.count_nonzero(tight_text_strokes) > 15:
            mask = cv2.bitwise_or(mask, tight_text_strokes)
            bubble_detected = True

    if bubble_detected:
        logger.info(f"[Speech Bubbles] Detected bubbles. Applying removal using {method}...")
        # Dynamic dilation fitting boundary size
        d = dilation if dilation >= 0 else max(4, int(np.sqrt(np.count_nonzero(mask)) * 0.06))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d))
        mask = cv2.dilate(mask, kernel, iterations=1)

        # Apply Erase Method
        if method == 'blur':
            blur_size = max(21, int(min(width, height) * 0.1) | 1)
            blurred = cv2.GaussianBlur(image, (blur_size, blur_size), 0)
            out = np.where(mask[:, :, np.newaxis] == 255, blurred, image)
        elif method == 'solid_white':
            out = image.copy()
            out[mask == 255] = (255, 255, 255)
        elif method == 'solid_black':
            out = image.copy()
            out[mask == 255] = (0, 0, 0)
        else:
            out = cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
        
        cv2.imwrite(output_path, out)
    else:
        logger.info("[Speech Bubbles] No bubbles detected.")
        cv2.imwrite(output_path, image)

    return bubble_detected

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Webtoon Speech Bubbles Cleaner")
    parser.add_argument("--image_path", required=True)
    parser.add_argument("--output_path", required=True)
    parser.add_argument("--method", default="inpaint")
    parser.add_argument("--sensitivity", type=float, default=50.0)
    parser.add_argument("--dilation", type=int, default=-1)
    parser.add_argument("--inpaint_radius", type=int, default=3)
    parser.add_argument("--detection_style", default="all")
    parser.add_argument("--ocr_lang", default="en")
    parser.add_argument("--morph_kernel_size", type=int, default=15)
    parser.add_argument("--morph_shape", default="ellipse")
    parser.add_argument("--custom_color_tolerance", type=float, default=25.0)
    parser.add_argument("--gpu", action="store_true")
    parser.add_argument("--fill_color")
    parser.add_argument("--custom_color_target")
    parser.add_argument("--custom_mask_path")
    parser.add_argument("--debug_path")

    args = parser.parse_args()

    # Parse target color if provided
    target_bgr = None
    if args.custom_color_target:
        try:
            parts = [int(x.strip()) for x in args.custom_color_target.split(",")]
            if len(parts) == 3:
                # RGB to BGR
                target_bgr = [parts[2], parts[1], parts[0]]
        except Exception:
            pass

    print("OPENCV_SUPPORT=TRUE")
    try:
        detected = remove_speech_bubbles(
            args.image_path,
            args.output_path,
            method=args.method,
            sensitivity=args.sensitivity,
            dilation=args.dilation,
            inpaint_radius=args.inpaint_radius,
            detection_style=args.detection_style,
            target_color=target_bgr,
            color_tolerance=args.custom_color_tolerance
        )
        if detected:
            print("BUBBLES_DETECTED=TRUE")
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
