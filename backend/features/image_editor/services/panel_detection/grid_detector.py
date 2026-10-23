"""
backend/features/image_editor/services/panel_detection/grid_detector.py
─────────────────────────────────────────────────────────────────────────────
Grid layout panel detection strategies using OpenCV contours or PIL projection profiles.
- Multi-scale Canny + Adaptive threshold edge fusion
- Morphological frame closing preserving gutters
- Polygonal contour extraction (supports diagonal/slanted frames)
- Reading flow aware ordering (RTL for Manga, LTR for Western)
- 2D projection tier and column decomposition fallback
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import base64
import logging
from typing import List, Dict, Tuple, Any, Optional
import cv2
import numpy as np
from PIL import Image

from common.media import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.services.image.panel_detection.grid_detector")

# ─────────────────────────────────────────────────────────────────────────────
# Default Detection & Filtering Constants
# ─────────────────────────────────────────────────────────────────────────────
DEFAULT_IS_WHITE_BG: bool = True
DEFAULT_THRESHOLD_VAL: int = 220
DEFAULT_CANNY_LOW: int = 25
DEFAULT_CANNY_HIGH: int = 120
DEFAULT_CLOSE_KERNEL_SIZE: int = 7
DEFAULT_HIGH_SENSITIVITY: bool = False

DEFAULT_MIN_PANEL_AREA: float = 5000.0
DEFAULT_MAX_ASPECT_RATIO: float = 10.0
DEFAULT_MIN_ASPECT_RATIO: float = 0.1
DEFAULT_MIN_WIDTH_PCT: float = 0.10
DEFAULT_MIN_HEIGHT_PX: int = 40

DEFAULT_READING_FLOW: str = "right_to_left"
DEFAULT_SENSITIVITY: float = 30.0

DEFAULT_CONFIDENCE_GRID: float = 0.95
DEFAULT_CONFIDENCE_TIER_COL: float = 0.90


def detect_manga_grid_panels(
    gray: np.ndarray,
    is_white_bg: bool = DEFAULT_IS_WHITE_BG,
    threshold_val: int = DEFAULT_THRESHOLD_VAL,
    canny_low: int = DEFAULT_CANNY_LOW,
    canny_high: int = DEFAULT_CANNY_HIGH,
    close_kernel_size: int = DEFAULT_CLOSE_KERNEL_SIZE,
    high_sensitivity: bool = DEFAULT_HIGH_SENSITIVITY,
    min_panel_area: float = DEFAULT_MIN_PANEL_AREA,
    max_aspect_ratio: float = DEFAULT_MAX_ASPECT_RATIO,
    min_aspect_ratio: float = DEFAULT_MIN_ASPECT_RATIO,
    min_width_pct: float = DEFAULT_MIN_WIDTH_PCT,
    min_height_px: int = DEFAULT_MIN_HEIGHT_PX,
    reading_flow: str = DEFAULT_READING_FLOW,
) -> List[Dict[str, Any]]:
    """
    State-of-the-art 2D Manga/Comic grid panel detector:
    - Multi-scale Canny + Adaptive threshold edge fusion
    - Morphological frame closing preserving gutters
    - Polygonal contour extraction (supports diagonal/slanted frames)
    - Reading flow aware ordering (RTL for Manga, LTR for Western)
    """
    h_img, w_img = gray.shape[:2]
    img_area = float(w_img * h_img)
    effective_min_area = min(min_panel_area, max(200.0, img_area * 0.008))

    # 1. Dynamic Edge & Adaptive Threshold Fusion
    otsu_val, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    dyn_thresh = int(otsu_val) if threshold_val == DEFAULT_THRESHOLD_VAL else threshold_val
    
    if high_sensitivity:
        block_s = max(11, (int(w_img * 0.02) | 1))
        thresh = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV if is_white_bg else cv2.THRESH_BINARY,
            block_s, 5
        )
    else:
        _, thresh = cv2.threshold(gray, dyn_thresh, 255, cv2.THRESH_BINARY_INV if is_white_bg else cv2.THRESH_BINARY)
        
    median_intensity = float(np.median(gray))
    # Only auto-compute if caller left defaults unchanged.
    # If the user passed a custom canny_low/canny_high those must be honoured exactly.
    computed_canny_low = max(10, int(0.66 * median_intensity)) if canny_low == DEFAULT_CANNY_LOW else canny_low
    computed_canny_high = min(250, int(1.33 * median_intensity)) if canny_high == DEFAULT_CANNY_HIGH else canny_high
    edges = cv2.Canny(gray, computed_canny_low, computed_canny_high)
    merged_mask = cv2.bitwise_or(thresh, edges)
    
    # 2. Morphological Closing: bridges dashed frames without bridging gutters.
    # Use the caller-supplied close_kernel_size so fine-tuning from AutoSlicer/API
    # actually takes effect. Fall back to auto-scaling only if close_kernel_size is
    # the default value which usually means "not explicitly set".
    if close_kernel_size == DEFAULT_CLOSE_KERNEL_SIZE:
        kernel_w = max(3, (int(w_img * 0.006) | 1))
        kernel_h = max(3, (int(h_img * 0.006) | 1))
    else:
        kernel_w = max(3, close_kernel_size)
        kernel_h = max(3, close_kernel_size)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_w, kernel_h))
    closed = cv2.morphologyEx(merged_mask, cv2.MORPH_CLOSE, kernel)
    
    # 3. Outer Contour Extraction
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    raw_boxes: List[Dict[str, Any]] = []

    if contours:
        for contour in contours:
            x_box, y_box, w_box, h_box = cv2.boundingRect(contour)

            # Filter full-canvas enclosing borders
            if w_box >= w_img * 0.98 and h_box >= h_img * 0.98:
                continue

            area = float(w_box * h_box)
            if area >= (img_area * 0.95) or area < effective_min_area:
                continue

            # Aspect ratio & minimum dimension filtering
            aspect = float(w_box) / float(max(1, h_box))
            min_dim_w = max(8, int(w_img * min_width_pct))
            min_dim_h = max(8, min_height_px)
            if aspect > max_aspect_ratio or aspect < min_aspect_ratio or w_box < min_dim_w or h_box < min_dim_h:
                continue

            # Polygonal approximation for diagonal/slanted comic panels
            peri = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
            polygon_pts = [[int(pt[0][0]), int(pt[0][1])] for pt in approx] if len(approx) >= 3 else None

            raw_boxes.append({
                "x": x_box,
                "y": y_box,
                "w": w_box,
                "h": h_box,
                "width": w_box,
                "height": h_box,
                "polygon": polygon_pts,
                "confidence": DEFAULT_CONFIDENCE_GRID,
                "label": "panel_manga_grid"
            })

    # If contours missed multi-column subpanels, run 2D projection fallback
    if len(raw_boxes) <= 1:
        pil_boxes = detect_manga_grid_pil(
            gray_arr=gray,
            is_white_bg=is_white_bg,
            sensitivity=DEFAULT_SENSITIVITY,
            min_height_px=min_height_px,
            min_panel_area=effective_min_area,
            reading_flow=reading_flow
        )
        if len(pil_boxes) > len(raw_boxes):
            raw_boxes = pil_boxes

    # Sort in reading order (Manga: Top-to-Bottom, Right-to-Left within tier)
    if raw_boxes:
        tier_height = max(40, int(h_img * 0.15))
        if reading_flow == "right_to_left":
            raw_boxes.sort(key=lambda b: (b["y"] // tier_height, -b["x"]))
        else:
            raw_boxes.sort(key=lambda b: (b["y"] // tier_height, b["x"]))

    return raw_boxes

def detect_manga_grid_pil(
    gray_arr: np.ndarray,
    is_white_bg: bool = DEFAULT_IS_WHITE_BG,
    sensitivity: float = DEFAULT_SENSITIVITY,
    min_height_px: int = DEFAULT_MIN_HEIGHT_PX,
    min_panel_area: float = DEFAULT_MIN_PANEL_AREA,
    max_aspect_ratio: float = DEFAULT_MAX_ASPECT_RATIO,
    min_aspect_ratio: float = DEFAULT_MIN_ASPECT_RATIO,
    reading_flow: str = DEFAULT_READING_FLOW,
) -> List[Dict[str, Any]]:
    """
    2D Projection Tier & Column Decomposition:
    1. Splits page vertically into horizontal tier bands (Row gutters).
    2. Within each horizontal tier band, splits horizontally into columns (Column gutters).
    """
    h, w = gray_arr.shape[:2]
    img_area = float(w * h)
    effective_min_area = min(min_panel_area, max(200.0, img_area * 0.008))
    row_means = np.mean(gray_arr, axis=1)
    
    thresh_limit = int(255 - (sensitivity * 2.5)) if is_white_bg else int(sensitivity * 2.5)
    thresh_limit = max(5, min(250, thresh_limit))
    
    is_content_row = (row_means < thresh_limit) if is_white_bg else (row_means > thresh_limit)
        
    # Bridge small gaps in rows
    smoothed_content = np.copy(is_content_row)
    gap_count = 0
    bridge_max = max(4, int(h * 0.015))
    for i in range(len(smoothed_content)):
        if not smoothed_content[i]:
            gap_count += 1
        else:
            if 0 < gap_count < bridge_max:
                smoothed_content[i - gap_count : i] = True
            gap_count = 0
            
    # Find tier row ranges
    tier_ranges: List[Tuple[int, int]] = []
    in_tier = False
    start_y = 0
    
    for i in range(h):
        if smoothed_content[i] and not in_tier:
            in_tier = True
            start_y = i
        elif not smoothed_content[i] and in_tier:
            in_tier = False
            end_y = i
            if end_y - start_y >= min_height_px:
                tier_ranges.append((start_y, end_y))
    if in_tier:
        end_y = h
        if end_y - start_y >= min_height_px:
            tier_ranges.append((start_y, end_y))
            
    raw_boxes: List[Dict[str, Any]] = []

    # Within each tier, decompose into side-by-side columns
    for start_y, end_y in tier_ranges:
        tier_slice = gray_arr[start_y:end_y, :]
        if tier_slice.size == 0:
            continue
        
        tier_h = tier_slice.shape[0]
        tier_bg = float(np.median(tier_slice))
        is_tier_white = tier_bg >= 128.0
        
        col_stds = np.std(tier_slice, axis=0)
        if is_tier_white:
            col_bg_ratio = np.sum(tier_slice > min(245.0, tier_bg - 15.0), axis=0) / float(tier_h)
        else:
            col_bg_ratio = np.sum(tier_slice < max(15.0, tier_bg + 15.0), axis=0) / float(tier_h)
            
        col_diffs = np.sum(np.abs(np.diff(tier_slice.astype(float), axis=1)) > 15.0, axis=0)
        col_stroke_counts = np.pad(col_diffs, (0, 1), mode='edge')
        
        is_gutter_col = ((col_bg_ratio >= 0.70) | (col_stds <= 6.0)) & (col_stroke_counts <= max(2, int(tier_h * 0.01)))
        is_content_col = ~is_gutter_col
        
        # Bridge small column gaps within artwork
        smoothed_cols = np.copy(is_content_col)
        c_gap = 0
        col_bridge_max = max(4, int(w * 0.012))
        for j in range(len(smoothed_cols)):
            if not smoothed_cols[j]:
                c_gap += 1
            else:
                if 0 < c_gap < col_bridge_max:
                    smoothed_cols[j - c_gap : j] = True
                c_gap = 0

        # Extract column panel segments
        col_segments: List[Tuple[int, int]] = []
        in_col = False
        start_x = 0
        min_col_w = max(10, int(w * 0.08))

        for j in range(w):
            if smoothed_cols[j] and not in_col:
                in_col = True
                start_x = j
            elif not smoothed_cols[j] and in_col:
                in_col = False
                end_x = j
                if end_x - start_x >= min_col_w:
                    col_segments.append((start_x, end_x))
        if in_col:
            end_x = w
            if end_x - start_x >= min_col_w:
                col_segments.append((start_x, end_x))

        if not col_segments:
            col_segments = [(0, w)]

        for cx1, cx2 in col_segments:
            bw = cx2 - cx1
            bh = end_y - start_y
            area = float(bw * bh)
            aspect = float(bw) / float(max(1, bh))

            min_w_limit = max(8, int(w * 0.05))
            min_h_limit = max(8, int(h * 0.04))
            if area >= effective_min_area and min_aspect_ratio <= aspect <= max_aspect_ratio and bw >= min_w_limit and bh >= min_h_limit:
                raw_boxes.append({
                    "x": cx1,
                    "y": start_y,
                    "w": bw,
                    "h": bh,
                    "width": bw,
                    "height": bh,
                    "confidence": DEFAULT_CONFIDENCE_TIER_COL,
                    "label": "panel_tier_column"
                })

    return raw_boxes


# ─────────────────────────────────────────────────────────────────────────────
# Dedicated FastAPI Service Endpoint Handler
# ─────────────────────────────────────────────────────────────────────────────

async def detect_manga_grid_service(
    request: Any,
) -> Any:
    """
    Dedicated FastAPI service handler for 2D multi-tier and multi-column manga grid panel detection.
    Resolves input image from URL or Base64, executes the grid detector, and returns structured
    DetectMangaGridResponse with PanelBoundingBox models.
    """
    start_time = time.perf_counter()

    raw_bytes = None
    target_url = getattr(request, "url", None) or getattr(request, "image_url", None)
    image_base64 = getattr(request, "image_base64", None)

    if target_url:
        logger.debug(f"[MangaGrid Service] Resolving image buffer from URL: {target_url}...")
        resolved = await resolve_image_to_buffer(target_url)
        raw_bytes = resolved.get("data")
    elif image_base64:
        logger.debug("[MangaGrid Service] Decoding base64 image data payload...")
        b64 = image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        logger.error("[MangaGrid Service] Failed to resolve raw image data from request.")
        raise ValueError("Could not resolve image data for manga grid detection.")

    pil_img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    img_w, img_h = pil_img.size
    gray = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2GRAY)

    reading_flow = getattr(request, "reading_flow", DEFAULT_READING_FLOW)
    is_white_bg = getattr(request, "is_white_bg", DEFAULT_IS_WHITE_BG)
    threshold_val = getattr(request, "threshold_val", DEFAULT_THRESHOLD_VAL)
    canny_low = getattr(request, "canny_low", DEFAULT_CANNY_LOW)
    canny_high = getattr(request, "canny_high", DEFAULT_CANNY_HIGH)
    close_kernel_size = getattr(request, "close_kernel_size", DEFAULT_CLOSE_KERNEL_SIZE)
    high_sensitivity = getattr(request, "high_sensitivity", DEFAULT_HIGH_SENSITIVITY)
    min_panel_area = getattr(request, "min_panel_area", DEFAULT_MIN_PANEL_AREA)
    max_aspect_ratio = getattr(request, "max_aspect_ratio", DEFAULT_MAX_ASPECT_RATIO)
    min_aspect_ratio = getattr(request, "min_aspect_ratio", DEFAULT_MIN_ASPECT_RATIO)
    min_width_pct = getattr(request, "min_width_pct", DEFAULT_MIN_WIDTH_PCT)
    min_height_px = getattr(request, "min_height_px", DEFAULT_MIN_HEIGHT_PX)

    raw_panels = detect_manga_grid_panels(
        gray=gray,
        is_white_bg=is_white_bg,
        threshold_val=threshold_val,
        canny_low=canny_low,
        canny_high=canny_high,
        close_kernel_size=close_kernel_size,
        high_sensitivity=high_sensitivity,
        min_panel_area=min_panel_area,
        max_aspect_ratio=max_aspect_ratio,
        min_aspect_ratio=min_aspect_ratio,
        min_width_pct=min_width_pct,
        min_height_px=min_height_px,
        reading_flow=reading_flow,
    )

    from features.platform.projects.schemas_project import (
        PanelBoundingBox,
        DetectMangaGridResponse,
        EntityLabel,
        EntityCategory,
    )

    boxes: List[PanelBoundingBox] = []
    for idx, p in enumerate(raw_panels, start=1):
        bw = p.get("w", p.get("width", 0))
        bh = p.get("h", p.get("height", 0))
        boxes.append(
            PanelBoundingBox(
                id=f"panel_{idx}",
                index=idx,
                x=int(p["x"]),
                y=int(p["y"]),
                w=int(bw),
                h=int(bh),
                width=int(bw),
                height=int(bh),
                polygon=p.get("polygon"),
                confidence=float(p.get("confidence", DEFAULT_CONFIDENCE_GRID)),
                label=p.get("label", EntityLabel.PANEL_STANDARD.value),
                category=EntityCategory.PANEL.value,
                sub_type="manga_grid_tier",
            )
        )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(
        f"[MangaGrid Service] Completed grid panel detection: {len(boxes)} panel(s) "
        f"in {elapsed_ms}ms (reading_flow={reading_flow})."
    )

    return DetectMangaGridResponse(
        success=True,
        crop_type="manga_grid",
        image_width=img_w,
        image_height=img_h,
        reading_flow=reading_flow,
        is_white_bg=is_white_bg,
        total_panels=len(boxes),
        panels=boxes,
        execution_time_ms=elapsed_ms,
        message=f"Successfully extracted {len(boxes)} manga grid panel(s).",
    )


__all__ = [
    "DEFAULT_IS_WHITE_BG",
    "DEFAULT_THRESHOLD_VAL",
    "DEFAULT_CANNY_LOW",
    "DEFAULT_CANNY_HIGH",
    "DEFAULT_CLOSE_KERNEL_SIZE",
    "DEFAULT_HIGH_SENSITIVITY",
    "DEFAULT_MIN_PANEL_AREA",
    "DEFAULT_MAX_ASPECT_RATIO",
    "DEFAULT_MIN_ASPECT_RATIO",
    "DEFAULT_MIN_WIDTH_PCT",
    "DEFAULT_MIN_HEIGHT_PX",
    "DEFAULT_READING_FLOW",
    "DEFAULT_SENSITIVITY",
    "DEFAULT_CONFIDENCE_GRID",
    "DEFAULT_CONFIDENCE_TIER_COL",
    "detect_manga_grid_panels",
    "detect_manga_grid_pil",
    "detect_manga_grid_service",
]


