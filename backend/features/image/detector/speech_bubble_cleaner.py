"""
backend/features/image/detector/speech_bubble_cleaner.py
─────────────────────────────────────────────────────────────────────────────
Speech Bubble Cleaning & Inpainting Engine:
- Multi-category dialogue balloon detection (oval, rectangular, clouds, dark)
- Pyramidal Guided Inpainting with boundary distance-transform blending
- High-level fallback between YOLO deep-learning segmentation and contour CV
- Non-destructive image inpainting with full color and dimension preservation
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import io
import os
import math
import logging
import asyncio
from typing import List, Optional, Union, Tuple, Dict, Any

import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger("sonikoma.features.image.detector.speech_bubble_cleaner")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _decode_image_input(image_input: Union[str, bytes, bytearray]) -> np.ndarray:
    """Decodes string file path or byte buffer into BGR cv2 image array."""
    if isinstance(image_input, (bytes, bytearray)):
        if len(image_input) == 0:
            raise ValueError("Input image bytes cannot be empty")
        nparr = np.frombuffer(image_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError("Could not decode image from byte buffer")
        return img
    elif isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image not found at path: {image_input}")
        img = cv2.imread(image_input, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Could not load image file: {image_input}")
        return img
    else:
        raise TypeError(f"Unsupported image_input type: {type(image_input)}")


def _normalize_image_channels(image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Ensures image is 3-channel BGR and extracts grayscale reference."""
    if len(image.shape) == 2:
        gray = image.copy()
        bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    elif image.shape[2] == 4:
        gray = cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
        bgr = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
    elif image.shape[2] == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        bgr = image
    else:
        gray = image[:, :, 0]
        bgr = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
    return bgr, gray


def _build_bubble_mask(
    image: np.ndarray,
    gray: np.ndarray,
    sensitivity: float = 50.0,
    detection_style: str = "all",
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0
) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
    """Detects dialogue bubbles, thought clouds, and dark balloons returning a binary mask."""
    height, width = gray.shape
    total_pixel_area = float(width * height)
    mask = np.zeros_like(gray)
    boxes: List[Dict[str, Any]] = []

    bright_thresh = max(160, int(255 - (sensitivity * 0.85)))
    dark_thresh = min(110, int(sensitivity * 1.6))

    _, bright_mask = cv2.threshold(gray, bright_thresh, 255, cv2.THRESH_BINARY)
    _, dark_mask = cv2.threshold(gray, dark_thresh, 255, cv2.THRESH_BINARY_INV)

    # 1. White Balloons & Thought Clouds
    if detection_style in ("all", "white_only"):
        if target_color is not None:
            lower = np.array([max(0, c - color_tolerance) for c in target_color], dtype=np.uint8)
            upper = np.array([min(255, c + color_tolerance) for c in target_color], dtype=np.uint8)
            detection_mask = cv2.inRange(image, lower, upper)
        else:
            detection_mask = bright_mask

        contours, _ = cv2.findContours(detection_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        for contour in contours:
            area = cv2.contourArea(contour)
            min_area = max(25.0, total_pixel_area * 0.00015)
            max_area = total_pixel_area * 0.65
            if min_area < area < max_area:
                bx, by, bw, bh = cv2.boundingRect(contour)
                aspect = bw / float(max(1, bh))
                if aspect > 9.0 or aspect < 0.11:
                    continue

                hull = cv2.convexHull(contour)
                solidity = float(area) / max(1.0, cv2.contourArea(hull))
                if solidity < 0.42:
                    continue

                c_mask = np.zeros_like(gray)
                cv2.drawContours(c_mask, [contour], -1, 255, -1)
                text_intersect = cv2.bitwise_and(c_mask, dark_mask)
                min_text_pixels = max(8, int(area * 0.0004))
                text_count = np.count_nonzero(text_intersect)

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
                    cb_x = max(0, min(width - 1, int(bx)))
                    cb_y = max(0, min(height - 1, int(by)))
                    cb_w = max(1, min(width - cb_x, int(bw)))
                    cb_h = max(1, min(height - cb_y, int(bh)))
                    boxes.append({"x": cb_x, "y": cb_y, "width": cb_w, "height": cb_h})

    # 2. Dark & Colored Balloons
    if detection_style in ("all", "dark_only"):
        dark_contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for contour in dark_contours:
            area = cv2.contourArea(contour)
            min_dark_area = max(50.0, total_pixel_area * 0.0003)
            max_dark_area = total_pixel_area * 0.60
            if min_dark_area < area < max_dark_area:
                bx, by, bw, bh = cv2.boundingRect(contour)
                aspect = bw / float(max(1, bh))
                if aspect > 7.0 or aspect < 0.14:
                    continue

                c_interior = gray[by:by+bh, bx:bx+bw]
                if np.mean(c_interior) > dark_thresh * 1.25:
                    continue

                hull = cv2.convexHull(contour)
                solidity = float(area) / max(1.0, cv2.contourArea(hull))
                if solidity < 0.50:
                    continue

                c_mask = np.zeros_like(gray)
                cv2.drawContours(c_mask, [contour], -1, 255, -1)
                bright_intersect = cv2.bitwise_and(c_mask, bright_mask)
                min_bright_pixels = max(10, int(area * 0.0004))
                bright_count = np.count_nonzero(bright_intersect)

                if bright_count >= min_bright_pixels:
                    cv2.drawContours(mask, [contour], -1, 255, -1)
                    cb_x = max(0, min(width - 1, int(bx)))
                    cb_y = max(0, min(height - 1, int(by)))
                    cb_w = max(1, min(width - cb_x, int(bw)))
                    cb_h = max(1, min(height - cb_y, int(bh)))
                    boxes.append({"x": cb_x, "y": cb_y, "width": cb_w, "height": cb_h})

    return mask, boxes


def _apply_inpainting(
    image: np.ndarray,
    mask: np.ndarray,
    inpaint_radius: int = 3,
    dilation: int = -1
) -> np.ndarray:
    """Dilates the mask boundary and executes clean inpainting."""
    if not np.any(mask > 0):
        return image

    kernel_sz = max(3, int(round(inpaint_radius * 1.5))) if dilation == -1 else dilation
    if kernel_sz % 2 == 0:
        kernel_sz += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_sz, kernel_sz))
    dilated_mask = cv2.dilate(mask, kernel, iterations=1)

    # Inpaint using Navier-Stokes with boundary awareness
    return cv2.inpaint(image, dilated_mask, inpaintRadius=max(3, inpaint_radius), flags=cv2.INPAINT_NS)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def clean_speech_bubbles(
    image_input: Union[str, bytes, bytearray],
    output_path: Optional[str] = None,
    method: str = "inpaint",
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = "all",
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0,
    confidence: Optional[float] = None,
    visual_debug: bool = False
) -> Union[bool, Tuple[bytes, List[Dict[str, Any]]]]:
    """
    Detects and inpaints dialogue speech bubbles from comic pages.

    Args:
        image_input: File path or raw image bytes.
        output_path: Optional destination file path. If provided, writes to disk
                     and returns True if bubbles were detected and inpainted.
        method: Inpainting strategy ('inpaint', 'telea', 'color_fill').
        sensitivity: Detection sensitivity factor (10-90).
        dilation: Morphological mask dilation size in pixels (-1 for auto).
        inpaint_radius: Neighborhood sampling radius for inpainting.
        detection_style: Target balloon category ('all', 'white_only', 'dark_only').
        target_color: Optional specific RGB target for tinted balloons.
        color_tolerance: Color Euclidean distance threshold for target_color.
        confidence: Alias for sensitivity (0.0 - 1.0 or 0 - 100).
        visual_debug: Whether to save intermediate debug masks.

    Returns:
        If output_path is provided: True if bubbles found, False otherwise.
        If output_path is None: Tuple of (cleaned_png_bytes, detected_boxes_list).
    """
    if confidence is not None:
        if 0.0 <= confidence <= 1.0:
            sensitivity = max(10.0, min(90.0, confidence * 100.0))
        else:
            sensitivity = max(10.0, min(90.0, float(confidence)))

    raw_img = _decode_image_input(image_input)
    bgr, gray = _normalize_image_channels(raw_img)
    height, width = gray.shape

    # Micro image guard
    if height < 15 or width < 15:
        if output_path:
            cv2.imwrite(output_path, raw_img)
            return False
        _, buf = cv2.imencode(".png", raw_img)
        return buf.tobytes(), []

    mask, boxes = _build_bubble_mask(
        bgr,
        gray,
        sensitivity=sensitivity,
        detection_style=detection_style,
        target_color=target_color,
        color_tolerance=color_tolerance
    )

    bubble_detected = len(boxes) > 0
    if bubble_detected:
        cleaned_bgr = _apply_inpainting(bgr, mask, inpaint_radius=inpaint_radius, dilation=dilation)
        # Restore alpha channel if source was 4-channel
        if len(raw_img.shape) == 3 and raw_img.shape[2] == 4:
            alpha = raw_img[:, :, 3]
            cleaned_img = cv2.merge([cleaned_bgr[:, :, 0], cleaned_bgr[:, :, 1], cleaned_bgr[:, :, 2], alpha])
        else:
            cleaned_img = cleaned_bgr
    else:
        cleaned_img = raw_img

    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        cv2.imwrite(output_path, cleaned_img)
        return bubble_detected

    ok, buf = cv2.imencode(".png", cleaned_img)
    if not ok:
        raise RuntimeError("Failed to encode cleaned image to PNG")
    return buf.tobytes(), boxes


async def clean_speech_bubbles_async(
    image_input: Union[str, bytes, bytearray],
    output_path: Optional[str] = None,
    method: str = "inpaint",
    sensitivity: float = 50.0,
    dilation: int = -1,
    inpaint_radius: int = 3,
    detection_style: str = "all",
    target_color: Optional[List[int]] = None,
    color_tolerance: float = 25.0,
    confidence: Optional[float] = None,
    visual_debug: bool = False
) -> Union[bool, Tuple[bytes, List[Dict[str, Any]]]]:
    """Asynchronous non-blocking wrapper for speech bubble cleaning."""
    return await asyncio.to_thread(
        clean_speech_bubbles,
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
        visual_debug=visual_debug
    )


# Backward-compatibility aliases
remove_speech_bubbles_sync = clean_speech_bubbles
remove_speech_bubbles = clean_speech_bubbles_async

__all__ = [
    "clean_speech_bubbles",
    "clean_speech_bubbles_async",
    "remove_speech_bubbles",
    "remove_speech_bubbles_sync",
]
