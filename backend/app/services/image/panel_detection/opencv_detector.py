"""
backend/app/services/image/panel_detection/opencv_detector.py
─────────────────────────────────────────────────────────────────────────────
Pure OpenCV Computer Vision Detection Engine:
- Bilateral line-art pre-filtering (removes paper textures while preserving black ink lines)
- Adaptive Otsu-Canny edge thresholding (median-tuned)
- Horizontal projection profile variance for tall webtoon gutter detection
- Contour extraction for rectangular, diagonal, and 2D Manga grid panels
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_CV = True
except ImportError:
    cv2 = None  # type: ignore
    HAS_CV = False

logger = logging.getLogger("sonikoma.services.panel_detection.opencv")


def detect_opencv_boxes(
    image_bytes: bytes,
    canny_low: int = 20,
    canny_high: int = 100,
    close_kernel_size: int = 15,
    min_width_pct: float = 0.15,
    min_height_px: int = 60,
    bleed_padding_px: int = 5
) -> Dict[str, Any]:
    """
    Executes pure OpenCV geometric contour and gutter analysis on image bytes.
    Returns detected rectangular panels, webtoon gutter valleys, and edge energy.
    """
    if not HAS_CV:
        logger.warning("[OpenCV Detector] cv2 module not installed. Returning empty results.")
        return {"panels": [], "gutters": [], "edge_energy": 0.0, "image_width": 0, "image_height": 0}

    # Decode image buffer into OpenCV BGR matrix
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Could not decode image bytes into OpenCV matrix.")

    img_h, img_w = img_bgr.shape[:2]
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # 1. Bilateral Filtering: Smooths textured background while preserving black line art
    filtered_gray = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

    # 2. Adaptive Median-Tuned Canny Thresholds
    median_val = float(np.median(filtered_gray))
    computed_low = max(10, int(max(0, (1.0 - 0.33) * median_val) if canny_low == 20 else canny_low))
    computed_high = min(250, int(min(255, (1.0 + 0.33) * median_val) if canny_high == 100 else canny_high))

    edges = cv2.Canny(filtered_gray, computed_low, computed_high)

    # 3. Morphological Closing: Bridges dashed or broken comic panel frames
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_kernel_size, close_kernel_size))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

    # 4. Contour Extraction
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_w = int(img_w * min_width_pct)
    min_h = max(20, min_height_px)
    total_area = float(img_w * img_h)

    panels: List[Dict[str, Any]] = []
    for idx, cnt in enumerate(contours):
        x, y, w, h = cv2.boundingRect(cnt)
        area = w * h

        # Filter out tiny noise contours
        if w < min_w or h < min_h or (area / total_area) < 0.02:
            continue

        # Polygon approximation to check if frame is rectangular or diagonal
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        is_diagonal = len(approx) not in (4, 5)

        # Apply bleed padding
        pad_x = max(0, x - bleed_padding_px)
        pad_y = max(0, y - bleed_padding_px)
        pad_w = min(img_w - pad_x, w + (bleed_padding_px * 2))
        pad_h = min(img_h - pad_y, h + (bleed_padding_px * 2))

        panels.append({
            "id": f"cv_panel_{idx + 1}",
            "x": int(pad_x),
            "y": int(pad_y),
            "w": int(pad_w),
            "h": int(pad_h),
            "width": int(pad_w),
            "height": int(pad_h),
            "confidence": 0.95,
            "label": "panel_diagonal" if is_diagonal else "panel_standard",
            "category": "panel",
            "area_pct": round(area / total_area, 4)
        })

    # Sort panels top-to-bottom, left-to-right
    panels.sort(key=lambda p: (p["y"], p["x"]))
    for i, p in enumerate(panels):
        p["index"] = i

    # 5. Horizontal Projection Profile for Webtoon Gutters
    row_variance = np.var(gray, axis=1)
    is_gutter_row = row_variance < 8.0
    gutter_indices = np.where(is_gutter_row)[0].tolist()

    # Calculate edge energy
    dy, dx = np.gradient(gray.astype(float))
    edge_energy = float(np.mean(np.abs(dx) + np.abs(dy)))

    logger.debug(
        f"[OpenCV Detector] Image {img_w}x{img_h}px -> Detected {len(panels)} panels, "
        f"{len(gutter_indices)} gutter rows, Edge energy: {edge_energy:.2f}"
    )

    return {
        "success": True,
        "panels": panels,
        "gutters": gutter_indices,
        "edge_energy": round(edge_energy, 2),
        "image_width": img_w,
        "image_height": img_h
    }
