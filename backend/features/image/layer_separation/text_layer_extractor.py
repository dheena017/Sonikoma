"""
backend/features/image_editor/services/layer_separation/text_layer_extractor.py
─────────────────────────────────────────────────────────────────────────────
Speech Bubble, Dialogue & SFX Text Layer Extraction Service:
- Deep learning (YOLO) balloon detection with OpenCV contour fallback
- Action sound effect (SFX) typography isolation
- Telea-based text-removal inpainting to generate clean textless plates
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Sequence, Tuple, Union

import cv2
import numpy as np

from features.image.detector.main_service_detector.speech_bubble_detector import (
    segment_speech_bubbles_and_text_balloons as segment_text_and_balloons,
)
from features.image.layer_separation.inpainting import (
    create_blank_png,
    smooth_contour,
)
from features.image.ocr.ocr_geometry import OcrSegment

logger = logging.getLogger("sonikoma.services.image.layer_separation.text_layer_extractor")


def extract_text_and_sfx_layers(
    original_img: np.ndarray,
    gray_img: np.ndarray,
    ocr_results: Union[List[OcrSegment], List[Dict[str, Any]], Sequence[Dict[str, Any]]],
    global_char_mask: np.ndarray,
    is_white_bg: bool,
    threshold_val: int,
    image_path: str,
) -> Tuple[bytes, bytes, np.ndarray, np.ndarray, np.ndarray]:
    """
    Extracts dialogue bubbles and action sound effects into dedicated PNG layers.
    Erases text from the working image using Telea inpainting to produce a textless plate.

    Args:
        original_img: Source 3-channel BGR image.
        gray_img: Grayscale version of source image.
        ocr_results: Extracted EasyOCR bounding boxes and text.
        global_char_mask: Rough character foreground mask to safeguard characters.
        is_white_bg: True if background is light/white, False if dark.
        threshold_val: Computed threshold luminance value.
        image_path: Path to panel image for YOLO model input.

    Returns:
        (text_layer_bytes, sfx_layer_bytes, textless_img, text_mask, sfx_mask)
    """
    height, width = original_img.shape[:2]
    text_mask = np.zeros((height, width), dtype=np.uint8)
    sfx_mask = np.zeros((height, width), dtype=np.uint8)

    # 1. Dark background speech-bubble pre-segmentation
    if not is_white_bg:
        logger.info("[Text Extraction] Dark background detected. Pre-segmenting bright speech bubbles.")
        _, bright_mask = cv2.threshold(gray_img, 200, 255, cv2.THRESH_BINARY)
        close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
        cleaned_bright = cv2.morphologyEx(bright_mask, cv2.MORPH_CLOSE, close_kernel)

        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned_bright, connectivity=8)
        for label_idx in range(1, num_labels):
            area = stats[label_idx, cv2.CC_STAT_AREA]
            if 100 < area < (height * width * 0.5):
                text_mask[labels == label_idx] = 255

    # 2. YOLO-based balloon & text detection
    yolo_text_mask = segment_text_and_balloons(image_path, conf_threshold=0.25)

    if yolo_text_mask is not None and np.any(yolo_text_mask > 0):
        logger.info("[Text Extraction] YOLO model successfully segmented text and balloon layers.")
        text_mask = cv2.bitwise_or(text_mask, yolo_text_mask)
    elif ocr_results:
        logger.info(
            f"[Text Extraction] YOLO yielded no mask. Falling back to OpenCV on {len(ocr_results)} OCR regions."
        )
        try:
            for res in ocr_results:
                pts = np.array(res["box"], dtype=np.int32)
                x, y, w, h_box = cv2.boundingRect(pts)
                if w <= 0 or h_box <= 0:
                    continue

                pad = max(w, h_box) // 2
                x1, y1 = max(0, x - pad), max(0, y - pad)
                x2, y2 = min(width, x + w + pad), min(height, y + h_box + pad)

                roi = original_img[y1:y2, x1:x2]
                if roi.size == 0:
                    continue

                roi_gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                thresh_bin = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
                )
                thresh_inv = cv2.adaptiveThreshold(
                    roi_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2
                )

                thresh_limit = min(220, threshold_val) if is_white_bg else max(180, threshold_val)
                _, simple_thresh = cv2.threshold(roi_gray, thresh_limit, 255, cv2.THRESH_BINARY)

                contours_bin, _ = cv2.findContours(thresh_bin, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_inv, _ = cv2.findContours(thresh_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                contours_simple, _ = cv2.findContours(simple_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

                all_contours = sorted(
                    list(contours_bin) + list(contours_inv) + list(contours_simple),
                    key=cv2.contourArea,
                    reverse=True,
                )

                cx, cy = (x + w // 2) - x1, (y + h_box // 2) - y1
                roi_box_area = w * h_box
                bubble_found = False

                for cnt in all_contours:
                    area = cv2.contourArea(cnt)
                    if area > 0.4 * roi_box_area and cv2.pointPolygonTest(cnt, (cx, cy), False) >= 0:
                        hull = cv2.convexHull(cnt)
                        hull_area = cv2.contourArea(hull)
                        solidity = area / hull_area if hull_area > 0 else 0

                        if solidity > 0.7:
                            closed_cnt = smooth_contour(cnt)
                            cnt_offset = closed_cnt + [x1, y1]
                            cv2.drawContours(text_mask, [cnt_offset], -1, 255, -1)

                            local_mask = np.zeros_like(roi_gray)
                            cv2.drawContours(local_mask, [closed_cnt], -1, 255, -1)
                            kernel_ellipse = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                            local_mask = cv2.morphologyEx(local_mask, cv2.MORPH_CLOSE, kernel_ellipse)
                            text_mask[y1:y2, x1:x2] = cv2.bitwise_or(text_mask[y1:y2, x1:x2], local_mask)

                            bubble_found = True
                            break

                # Non-bubble text (action sound effects / SFX)
                if not bubble_found:
                    tx1, ty1 = max(0, x), max(0, y)
                    tx2, ty2 = min(width, x + w), min(height, y + h_box)
                    exact_roi = original_img[ty1:ty2, tx1:tx2]
                    if exact_roi.size > 0:
                        smoothed_roi = cv2.bilateralFilter(exact_roi, d=9, sigmaColor=75, sigmaSpace=75)
                        smoothed_roi_gray = cv2.cvtColor(smoothed_roi, cv2.COLOR_BGR2GRAY)
                        canny_edges = cv2.Canny(smoothed_roi_gray, 50, 150)
                        edge_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
                        dilated_edges = cv2.dilate(canny_edges, edge_kernel, iterations=1)

                        roi_contours, _ = cv2.findContours(dilated_edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                        filled_text_mask = np.zeros_like(smoothed_roi_gray)
                        roi_w, roi_h = tx2 - tx1, ty2 - ty1
                        min_pixel_area = max(2, int((roi_w * roi_h) * 0.0005))
                        max_pixel_area = int((roi_w * roi_h) * 0.35)

                        for c in roi_contours:
                            c_area = cv2.contourArea(c)
                            if min_pixel_area <= c_area <= max_pixel_area:
                                smoothed_c = smooth_contour(c, factor=0.005)
                                _, _, cw, ch = cv2.boundingRect(smoothed_c)
                                aspect_ratio = float(cw) / ch if ch > 0 else 0
                                if 0.05 < aspect_ratio < 20.0:
                                    cv2.drawContours(filled_text_mask, [smoothed_c], -1, 255, -1)

                        num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
                            filled_text_mask, connectivity=8
                        )
                        final_roi_mask = np.zeros_like(filled_text_mask)
                        for label_idx in range(1, num_labels):
                            if stats[label_idx, cv2.CC_STAT_AREA] >= min_pixel_area:
                                final_roi_mask[labels == label_idx] = 255

                        sfx_mask[ty1:ty2, tx1:tx2] = cv2.bitwise_or(sfx_mask[ty1:ty2, tx1:tx2], final_roi_mask)

        except Exception as e:
            logger.error(f"Error during fallback text separation: {e}", exc_info=True)

    # 3. Safeguard character boundaries and inpaint textless plate
    textless_img = original_img.copy()
    if np.any(text_mask > 0):
        try:
            if np.any(global_char_mask > 0):
                char_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
                eroded_char_mask = cv2.erode(global_char_mask, char_kernel, iterations=1)
                text_mask = cv2.bitwise_and(text_mask, cv2.bitwise_not(eroded_char_mask))

            text_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            text_layer[text_mask == 0] = [0, 0, 0, 0]
            _, buffer = cv2.imencode(".png", text_layer)
            text_layer_bytes = buffer.tobytes()

            dilated_text_mask = cv2.dilate(text_mask, np.ones((5, 5), np.uint8), iterations=2)
            textless_img = cv2.inpaint(original_img, dilated_text_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
        except Exception as e:
            logger.error(f"Error compiling text layer or inpainting textless image: {e}", exc_info=True)
            text_layer_bytes = create_blank_png(width, height)
    else:
        text_layer_bytes = create_blank_png(width, height)

    # 4. Compile sound effects (SFX) layer
    if np.any(sfx_mask > 0):
        try:
            sfx_layer = cv2.cvtColor(original_img, cv2.COLOR_BGR2BGRA)
            sfx_layer[sfx_mask == 0] = [0, 0, 0, 0]
            _, buffer = cv2.imencode(".png", sfx_layer)
            sfx_layer_bytes = buffer.tobytes()
        except Exception as e:
            logger.error(f"Error compiling SFX layer: {e}", exc_info=True)
            sfx_layer_bytes = create_blank_png(width, height)
    else:
        sfx_layer_bytes = create_blank_png(width, height)

    return text_layer_bytes, sfx_layer_bytes, textless_img, text_mask, sfx_mask


__all__ = ["extract_text_and_sfx_layers"]
