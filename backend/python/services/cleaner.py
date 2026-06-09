import os
import sys
import argparse
import numpy as np
from PIL import Image, ImageFilter

try:
    import cv2
    has_cv = True
except ImportError:
    has_cv = False

def remove_speech_bubbles(image_path: str, output_path: str, method: str = 'inpaint', sensitivity: float = 50.0, dilation: int = -1, inpaint_radius: int = 3, detection_style: str = 'all') -> bool:
    """
    Detects and erases dialogue speech bubbles from comic images.
    Returns True if bubbles were detected, False otherwise.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")

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

    contours, _ = cv2.findContours(bright_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    mask = np.zeros_like(gray)
    bubble_detected = False

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)

        if area < (width * height) * 0.001:
            continue

        # Check if it's a bubble by looking for text inside
        c_mask = np.zeros_like(gray)
        cv2.drawContours(c_mask, [contour], -1, 255, -1)
        text_intersect = cv2.bitwise_and(c_mask, dark_mask)
        if np.count_nonzero(text_intersect) > 10:
            cv2.drawContours(mask, [contour], -1, 255, -1)
            bubble_detected = True

    if bubble_detected:
        d = dilation if dilation > 0 else max(4, int(min(width, height) * 0.01))
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d))
        mask = cv2.dilate(mask, kernel, iterations=1)

        if method == 'blur':
            blur_size = max(21, int(min(width, height) * 0.1) | 1)
            blurred = cv2.GaussianBlur(image, (blur_size, blur_size), 0)
            out = np.where(mask[:, :, np.newaxis] == 255, blurred, image)
        else:
            out = cv2.inpaint(image, mask, inpaint_radius, cv2.INPAINT_TELEA)
        
        cv2.imwrite(output_path, out)
    else:
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

    print("OPENCV_SUPPORT=TRUE")
    try:
        detected = remove_speech_bubbles(
            args.image_path,
            args.output_path,
            method=args.method,
            sensitivity=args.sensitivity,
            dilation=args.dilation,
            inpaint_radius=args.inpaint_radius,
            detection_style=args.detection_style
        )
        if detected:
            print("BUBBLES_DETECTED=TRUE")
        print("SUCCESS")
    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
