"""
backend/app/services/image/panel_cleaner.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble detector and automatic panel cleaner engine.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import argparse
import logging
import numpy as np
from PIL import Image

logger = logging.getLogger("sonikoma.services.image.processing.panel_cleaner")

try:
    import cv2
    has_cv = True
except ImportError:
    has_cv = False

import asyncio
from typing import List, Optional, Union, Tuple, Dict, Any

def remove_speech_bubbles_sync(
    image_input: Union[str, bytes, bytearray],
    output_path: Optional[str] = None,
    method: str = 'inpaint',
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = 'all',
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0,
    confidence: Optional[float] = None,
    visual_debug: bool = False,
) -> Union[bool, Tuple[bytes, List[Dict[str, Any]]]]:
    """
    Detects and erases dialogue speech bubbles from comic images.
    - If output_path is provided: writes to disk and returns True if bubbles detected, False otherwise.
    - If output_path is None: returns (cleaned_png_bytes, detected_boxes).
    """
    if confidence is not None:
        if 0.0 <= confidence <= 1.0:
            sensitivity = max(10.0, min(90.0, confidence * 100.0))
        else:
            sensitivity = max(10.0, min(90.0, float(confidence)))

    if isinstance(image_input, (bytes, bytearray)):
        if len(image_input) == 0:
            raise ValueError("Input image bytes cannot be empty")
        if not has_cv:
            if output_path:
                with open(output_path, "wb") as f:
                    f.write(image_input)
                return False
            return bytes(image_input), []
        nparr = np.frombuffer(image_input, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("Could not decode image from byte buffer")
    elif isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image not found at path: {image_input}")
        if not has_cv:
            if output_path:
                img = Image.open(image_input).convert("RGB")
                img.save(output_path)
                return False
            with open(image_input, "rb") as f:
                return f.read(), []
        image = cv2.imread(image_input, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError(f"Could not load image file: {image_input}")
    else:
        raise TypeError(f"Unsupported image_input type: {type(image_input)}")

    # ── Category 8: Image Robustness (1-channel, 3-channel, 4-channel alpha) ─────
    if len(image.shape) == 2:
        gray = image.copy()
        image = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    elif image.shape[2] == 4:
        gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
        image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    elif image.shape[2] == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image[:, :, 0]

    height, width = gray.shape
    if height < 15 or width < 15:
        # Micro image guard
        if output_path:
            cv2.imwrite(output_path, image)
            return False
        _, buf = cv2.imencode('.png', image)
        return buf.tobytes(), []

    logger.info(f"[Speech Bubbles] Processing image {width}x{height} (method: {method}, sensitivity: {sensitivity})")

    bright_thresh = max(160, int(255 - (sensitivity * 0.85)))
    dark_thresh = min(110, int(sensitivity * 1.6))

    _, bright_mask = cv2.threshold(gray, bright_thresh, 255, cv2.THRESH_BINARY)
    _, dark_mask = cv2.threshold(gray, dark_thresh, 255, cv2.THRESH_BINARY_INV)

    mask = np.zeros_like(gray)
    bubble_detected = False
    boxes: List[Dict[str, Any]] = []
    total_pixel_area = float(width * height)

    # ── Category 1 & 2: White Balloons & Thought Clouds (Oval, Rectangular, Clouds) ──
    if detection_style in ("all", "white_only"):
        if target_color is not None:
            lower_bound = np.array([max(0, c - color_tolerance) for c in target_color], dtype=np.uint8)
            upper_bound = np.array([min(255, c + color_tolerance) for c in target_color], dtype=np.uint8)
            detection_mask = cv2.inRange(image, lower_bound, upper_bound)
        else:
            detection_mask = bright_mask

        contours, _ = cv2.findContours(detection_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            area = cv2.contourArea(contour)
            # Area filter: allows small thought-bubble trailing circles up to 65% frame
            min_bubble_area = max(25.0, total_pixel_area * 0.00015)
            max_bubble_area = total_pixel_area * 0.65
            if min_bubble_area < area < max_bubble_area:
                bx, by, bw, bh = cv2.boundingRect(contour)
                aspect = bw / float(max(1, bh))
                # Category 4 & 5: Reject extreme needle speed lines or thin border borders
                if aspect > 9.0 or aspect < 0.11:
                    continue

                # Category 5: Convexity / Solidity check against jagged hair & speed lines
                hull = cv2.convexHull(contour)
                hull_area = cv2.contourArea(hull)
                solidity = float(area) / max(1.0, hull_area)
                if solidity < 0.42:
                    continue

                c_mask = np.zeros_like(gray)
                cv2.drawContours(c_mask, [contour], -1, 255, -1)
                text_intersect = cv2.bitwise_and(c_mask, dark_mask)
                # Category 6: Small lettering text tolerance
                min_text_pixels = max(8, int(area * 0.0004))
                text_count = np.count_nonzero(text_intersect)

                # Accepts either balloons with verified text OR small trailing thought circles
                is_trailing_circle = (area < total_pixel_area * 0.01 and solidity > 0.75 and 0.6 < aspect < 1.6)
                has_valid_text = False
                if text_count >= min_text_pixels:
                    t_cnts, _ = cv2.findContours(text_intersect, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    valid_glyphs = [
                        tc for tc in t_cnts
                        if 3 <= cv2.boundingRect(tc)[2] and 4 <= cv2.boundingRect(tc)[3]
                        and (cv2.boundingRect(tc)[2] / float(max(1, cv2.boundingRect(tc)[3])) < 8.0)
                    ]
                    if len(valid_glyphs) >= 1:
                        has_valid_text = True

                if has_valid_text or is_trailing_circle:
                    cv2.drawContours(mask, [contour], -1, 255, -1)
                    bubble_detected = True
                    # Category 7: Clamp boundary coordinates
                    cb_x = max(0, min(width - 1, int(bx)))
                    cb_y = max(0, min(height - 1, int(by)))
                    cb_w = max(1, min(width - cb_x, int(bw)))
                    cb_h = max(1, min(height - cb_y, int(bh)))
                    boxes.append({"x": cb_x, "y": cb_y, "width": cb_w, "height": cb_h})

    # ── Category 3: Dark & Colored Balloons (Dark balloons with white/light text) ─────
    if detection_style in ("all", "dark_only"):
        dark_contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in dark_contours:
            area = cv2.contourArea(contour)
            min_dark_bubble_area = max(50.0, total_pixel_area * 0.0003)
            max_dark_bubble_area = total_pixel_area * 0.60
            if min_dark_bubble_area < area < max_dark_bubble_area:
                bx, by, bw, bh = cv2.boundingRect(contour)
                aspect = bw / float(max(1, bh))
                if aspect > 7.0 or aspect < 0.14:
                    continue

                # Must truly be a dark interior, not a bright hole in the background
                c_interior = gray[by:by+bh, bx:bx+bw]
                if np.mean(c_interior) > dark_thresh * 1.25:
                    continue

                hull = cv2.convexHull(contour)
                hull_area = cv2.contourArea(hull)
                solidity = float(area) / max(1.0, hull_area)
                if solidity < 0.50:
                    continue

                c_mask = np.zeros_like(gray)
                cv2.drawContours(c_mask, [contour], -1, 255, -1)
                bright_intersect = cv2.bitwise_and(c_mask, bright_mask)
                min_bright_pixels = max(10, int(area * 0.0004))

                has_valid_bright_text = False
                if np.count_nonzero(bright_intersect) >= min_bright_pixels:
                    b_cnts, _ = cv2.findContours(bright_intersect, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    valid_b_glyphs = [
                        tc for tc in b_cnts
                        if 3 <= cv2.boundingRect(tc)[2] and 4 <= cv2.boundingRect(tc)[3]
                        and (cv2.boundingRect(tc)[2] / float(max(1, cv2.boundingRect(tc)[3])) < 8.0)
                    ]
                    if len(valid_b_glyphs) >= 1:
                        has_valid_bright_text = True

                if has_valid_bright_text:
                    cv2.drawContours(mask, [contour], -1, 255, -1)
                    bubble_detected = True
                    cb_x = max(0, min(width - 1, int(bx)))
                    cb_y = max(0, min(height - 1, int(by)))
                    cb_w = max(1, min(width - cb_x, int(bw)))
                    cb_h = max(1, min(height - cb_y, int(bh)))
                    boxes.append({"x": cb_x, "y": cb_y, "width": cb_w, "height": cb_h})

    # ── Category 6: Text Edge Cases (Horizontal & Vertical lettering closing) ───────
    if detection_style in ("all", "text_only"):
        k_size = max(5, min(25, int(min(width, height) * 0.015) | 1))
        # Horizontal text kernel + vertical text kernel
        kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (k_size, max(3, k_size // 3)))
        kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (max(3, k_size // 3), k_size))

        closed_h = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, kernel_h)
        closed_v = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, kernel_v)
        closed_dark = cv2.bitwise_or(closed_h, closed_v)

        text_contours, _ = cv2.findContours(closed_dark, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        region_mask = np.zeros_like(gray)

        for tc in text_contours:
            tx, ty, tw, th = cv2.boundingRect(tc)
            t_area = cv2.contourArea(tc)
            if total_pixel_area * 0.00008 < t_area < total_pixel_area * 0.25:
                if tw >= 6 and th >= 6 and (tw / float(max(1, th)) < 7.0) and (th / float(max(1, tw)) < 7.0):
                    tc_sub = dark_mask[ty:ty+th, tx:tx+tw]
                    tc_density = np.count_nonzero(tc_sub) / float(max(1, tw * th))
                    # Text glyph blocks have moderate stroke density (8% to 60%)
                    if 0.08 <= tc_density <= 0.60:
                        cv2.drawContours(region_mask, [tc], -1, 255, -1)
                        cb_x = max(0, min(width - 1, int(tx)))
                        cb_y = max(0, min(height - 1, int(ty)))
                        cb_w = max(1, min(width - cb_x, int(tw)))
                        cb_h = max(1, min(height - cb_y, int(th)))
                        boxes.append({"x": cb_x, "y": cb_y, "width": cb_w, "height": cb_h})

        tight_text_strokes = cv2.bitwise_and(region_mask, dark_mask)
        if np.count_nonzero(tight_text_strokes) > 10:
            mask = cv2.bitwise_or(mask, tight_text_strokes)
            bubble_detected = True
            for tc in text_contours:
                tx, ty, tw, th = cv2.boundingRect(tc)
                t_area = cv2.contourArea(tc)
                if (width * height) * 0.0001 < t_area < (width * height) * 0.25 and tw > 6 and th > 6:
                    boxes.append({"x": int(tx), "y": int(ty), "width": int(tw), "height": int(th)})

    if visual_debug:
        out = image.copy()
        for b in boxes:
            cv2.rectangle(out, (b["x"], b["y"]), (b["x"] + b["width"], b["y"] + b["height"]), (0, 255, 0), 2)
    elif bubble_detected:
        # Category 9: Failure safety against runaway ambiguous masks (e.g. > 65% of entire panel)
        if np.count_nonzero(mask) > (width * height) * 0.65:
            logger.warning("[Speech Bubbles] Mask exceeds 65% panel coverage threshold. Aborting inpainting to protect image.")
            out = image
        else:
            logger.info(f"[Speech Bubbles] Detected bubbles. Applying removal using {method}...")
            d = dilation if dilation >= 0 else max(4, int(np.sqrt(np.count_nonzero(mask)) * 0.06))
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d))
            mask = cv2.dilate(mask, kernel, iterations=1)

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
    else:
        logger.info("[Speech Bubbles] No bubbles detected.")
        out = image

    if output_path is not None:
        if os.path.dirname(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, out)
        return bubble_detected

    success, buf = cv2.imencode('.png', out)
    if not success:
        raise RuntimeError("Failed to encode cleaned image to PNG")
    return buf.tobytes(), boxes


async def remove_speech_bubbles(
    image_input: Union[str, bytes, bytearray],
    output_path: Optional[str] = None,
    method: str = 'inpaint',
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = 'all',
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0,
    confidence: Optional[float] = None,
    visual_debug: bool = False,
) -> Union[bool, Tuple[bytes, List[Dict[str, Any]]]]:
    """Async wrapper for non-blocking speech bubble removal and inpainting."""
    return await asyncio.to_thread(
        remove_speech_bubbles_sync,
        image_input,
        output_path,
        method=method,
        sensitivity=sensitivity,
        dilation=dilation,
        inpaint_radius=inpaint_radius,
        detection_style=detection_style,
        target_color=target_color,
        color_tolerance=color_tolerance,
        confidence=confidence,
        visual_debug=visual_debug,
    )


# Human-readable aliases
erase_speech_bubbles_from_panel = remove_speech_bubbles_sync


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

    target_bgr = None
    if args.custom_color_target:
        try:
            parts = [int(x.strip()) for x in args.custom_color_target.split(",")]
            if len(parts) == 3:
                target_bgr = [parts[2], parts[1], parts[0]]
        except Exception:
            pass

    print("OPENCV_SUPPORT=TRUE")
    try:
        detected = remove_speech_bubbles_sync(
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
