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

    # 1. Multi-Channel Color Edge Detection (RGB + LAB)
    # Smooths textured background while preserving color contrasts and black ink lines
    filtered_bgr = cv2.bilateralFilter(img_bgr, d=7, sigmaColor=50, sigmaSpace=50)
    lab = cv2.cvtColor(filtered_bgr, cv2.COLOR_BGR2LAB)
    
    # Adaptive Median-Tuned Canny Thresholds on Grayscale + Color Channels
    median_val = float(np.median(gray))
    computed_low = max(10, int(max(0, (1.0 - 0.33) * median_val) if canny_low == 20 else canny_low))
    computed_high = min(250, int(min(255, (1.0 + 0.33) * median_val) if canny_high == 100 else canny_high))

    edges_gray = cv2.Canny(filtered_bgr, computed_low, computed_high)
    edges_l = cv2.Canny(lab[:, :, 0], computed_low, computed_high)
    edges_a = cv2.Canny(lab[:, :, 1], max(15, computed_low // 2), max(60, computed_high // 2))
    edges_b = cv2.Canny(lab[:, :, 2], max(15, computed_low // 2), max(60, computed_high // 2))
    fused_edges = cv2.bitwise_or(edges_gray, edges_l)
    fused_edges = cv2.bitwise_or(fused_edges, cv2.bitwise_or(edges_a, edges_b))

    # 2. Morphological Closing: Bridges dashed or broken comic panel frames
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (close_kernel_size, close_kernel_size))
    closed = cv2.morphologyEx(fused_edges, cv2.MORPH_CLOSE, kernel)

    # 3. Contour Extraction
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
        polygon_pts = [[int(pt[0][0]), int(pt[0][1])] for pt in approx] if len(approx) >= 3 else None

        # Apply bleed padding safely
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
            "polygon": polygon_pts,
            "area_pct": round(area / total_area, 4)
        })

    # Sort panels top-to-bottom, left-to-right
    panels.sort(key=lambda p: (p["y"], p["x"]))
    for i, p in enumerate(panels):
        p["index"] = i

    # 5. Horizontal Projection Profile & Gradient for Webtoon Gutters
    row_variance = np.var(gray, axis=1)
    is_gutter_row = row_variance < 8.0
    gutter_indices = np.where(is_gutter_row)[0].tolist()

    # Calculate edge energy efficiently using fast Sobel on sample/gray
    try:
        sample_gray = cv2.resize(gray, (min(800, img_w), min(1200, img_h))) if (img_h > 2000 or img_w > 1200) else gray
        sobelx = cv2.Sobel(sample_gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(sample_gray, cv2.CV_32F, 0, 1, ksize=3)
        edge_energy = float(np.mean(np.abs(sobelx) + np.abs(sobely)))
    except Exception:
        edge_energy = 0.0


    return {
        "success": True,
        "panels": panels,
        "gutters": gutter_indices,
        "edge_energy": round(edge_energy, 2),
        "image_width": img_w,
        "image_height": img_h
    }
