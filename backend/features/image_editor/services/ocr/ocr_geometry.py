"""
backend/features/image_editor/services/ocr/ocr_geometry.py
─────────────────────────────────────────────────────────────────────────────
OCR Geometry, Coordinate Transformations & Sliding-Window Tiling Utilities:
- Typed data definitions (OcrSegment)
- Canvas normalization to RGB numpy array
- Axis-aligned bounding box calculation
- Canvas coordinate reprojection for scaled tiles
- Non-Maximum Suppression (NMS) deduplication across tile seams
─────────────────────────────────────────────────────────────────────────────
"""

import io
import os
from typing import Any, List, Optional, Tuple, TypedDict

import cv2
import numpy as np
from PIL import Image

# ─────────────────────────────────────────────────────────────────────────────
# 1. Module Constants
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_CONFIDENCE_THRESHOLD: float = 0.20
DEFAULT_BUBBLE_CONFIDENCE: float = 0.20
DEFAULT_BUBBLE_PADDING_RATIO: float = 0.05
MAX_SINGLE_PASS_DIMENSION_PX: int = 2000
SLIDING_TILE_HEIGHT_PX: int = 1200
SLIDING_TILE_OVERLAP_PX: int = 150
SLIDING_TILE_MAX_WIDTH_PX: int = 1600
TALL_STRIP_MIN_HEIGHT_PX: int = 2000
TALL_STRIP_ASPECT_RATIO_MIN: float = 1.5
DEDUPLICATION_IOU_THRESHOLD: float = 0.50
MIN_IMAGE_DIMENSION_PX: int = 10


# ─────────────────────────────────────────────────────────────────────────────
# 2. Schema Definitions
# ─────────────────────────────────────────────────────────────────────────────

class OcrSegment(TypedDict):
    """
    Structured dictionary representation of an extracted text segment.

    Attributes:
        text (str): Extracted transcription string.
        conf (float): Model confidence score between 0.0 and 1.0.
        box (List[List[int]]): 4-point bounding quad polygon [[x, y], ...] in canvas pixels.
        box_pct (List[List[float]]): Normalized relative polygon coordinates [[x_pct, y_pct], ...].
    """
    text: str
    conf: float
    box: List[List[int]]
    box_pct: List[List[float]]


# ─────────────────────────────────────────────────────────────────────────────
# 3. Canvas Normalization & Coordinates
# ─────────────────────────────────────────────────────────────────────────────

def resolve_image_input_to_rgb(image_input: Any) -> Tuple[np.ndarray, int, int]:
    """Decodes and normalizes varied image inputs into a standardized RGB NumPy array."""
    if image_input is None:
        raise ValueError("Image input cannot be None.")

    if isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB")
        w, h = pil_img.size
        return np.array(pil_img, dtype=np.uint8), w, h

    if isinstance(image_input, bytes):
        if len(image_input) == 0:
            raise ValueError("Image input bytes buffer is empty.")
        pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        w, h = pil_img.size
        return np.array(pil_img, dtype=np.uint8), w, h

    if isinstance(image_input, str):
        if not os.path.exists(image_input):
            raise FileNotFoundError(f"Image file does not exist on disk: {image_input}")
        pil_img = Image.open(image_input).convert("RGB")
        w, h = pil_img.size
        return np.array(pil_img, dtype=np.uint8), w, h

    if isinstance(image_input, np.ndarray):
        if image_input.ndim == 2:
            rgb = cv2.cvtColor(image_input, cv2.COLOR_GRAY2RGB)
        elif image_input.shape[2] == 4:
            rgb = cv2.cvtColor(image_input, cv2.COLOR_RGBA2RGB)
        else:
            rgb = image_input
        h, w = rgb.shape[:2]
        return rgb, w, h

    raise ValueError(f"Unsupported image input type: {type(image_input).__name__}")


def compute_axis_aligned_bbox(box_points: List[List[int]]) -> Tuple[int, int, int, int]:
    """Calculates the 2D axis-aligned bounding box (min_x, min_y, max_x, max_y) from quad polygon vertices."""
    xs = [p[0] for p in box_points]
    ys = [p[1] for p in box_points]
    return min(xs), min(ys), max(xs), max(ys)


def reproject_box_to_original_canvas(
    box_points: List[List[float]],
    scale_factor: float,
    y_offset_px: int,
    orig_width_px: int,
    orig_height_px: int,
) -> Tuple[List[List[int]], List[List[float]]]:
    """Reprojects tile-relative OCR quad coordinates back into the full original image space."""
    pixel_box: List[List[int]] = []
    pct_box: List[List[float]] = []

    safe_scale = max(1e-6, scale_factor)
    max_w = max(1, orig_width_px)
    max_h = max(1, orig_height_px)

    for pt in box_points:
        px = int(round(pt[0] / safe_scale))
        py = int(round(pt[1] / safe_scale)) + y_offset_px
        px_clamped = max(0, min(orig_width_px, px))
        py_clamped = max(0, min(orig_height_px, py))
        pixel_box.append([px_clamped, py_clamped])
        pct_box.append([round(px_clamped / max_w, 4), round(py_clamped / max_h, 4)])

    return pixel_box, pct_box


def deduplicate_ocr_segments_nms(
    segments: List[OcrSegment],
    iou_threshold: float = DEDUPLICATION_IOU_THRESHOLD,
) -> List[OcrSegment]:
    """Deduplicates overlapping OCR segments across tile seams using Non-Maximum Suppression."""
    if not segments:
        return []

    sorted_segments = sorted(segments, key=lambda s: float(s.get("conf", 0.0)), reverse=True)
    kept: List[OcrSegment] = []

    for candidate in sorted_segments:
        cx1, cy1, cx2, cy2 = compute_axis_aligned_bbox(candidate["box"])
        c_area = max(1, (cx2 - cx1) * (cy2 - cy1))
        is_duplicate = False

        for existing in kept:
            ex1, ey1, ex2, ey2 = compute_axis_aligned_bbox(existing["box"])
            e_area = max(1, (ex2 - ex1) * (ey2 - ey1))

            ix1, iy1 = max(cx1, ex1), max(cy1, ey1)
            ix2, iy2 = min(cx2, ex2), min(cy2, ey2)
            iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
            inter = iw * ih

            if inter > 0:
                iou = inter / float(c_area + e_area - inter)
                if iou >= iou_threshold:
                    is_duplicate = True
                    break

                cand_text = candidate["text"].strip().lower()
                exist_text = existing["text"].strip().lower()
                if cand_text == exist_text and iou >= 0.20:
                    is_duplicate = True
                    break

        if not is_duplicate:
            kept.append(candidate)

    return kept


__all__ = [
    "DEFAULT_CONFIDENCE_THRESHOLD",
    "DEFAULT_BUBBLE_CONFIDENCE",
    "DEFAULT_BUBBLE_PADDING_RATIO",
    "MAX_SINGLE_PASS_DIMENSION_PX",
    "SLIDING_TILE_HEIGHT_PX",
    "SLIDING_TILE_OVERLAP_PX",
    "SLIDING_TILE_MAX_WIDTH_PX",
    "TALL_STRIP_MIN_HEIGHT_PX",
    "TALL_STRIP_ASPECT_RATIO_MIN",
    "DEDUPLICATION_IOU_THRESHOLD",
    "MIN_IMAGE_DIMENSION_PX",
    "OcrSegment",
    "resolve_image_input_to_rgb",
    "compute_axis_aligned_bbox",
    "reproject_box_to_original_canvas",
    "deduplicate_ocr_segments_nms",
]
