"""
backend/app/services/image/crop/detect_type_service.py
─────────────────────────────────────────────────────────────────────────────
5-Layer Layout Classifier Service:
1. Geometric Aspect Ratio
2. Background Color & Palette Scanner
3. Projection Profile & Seam Detector
4. Edge Complexity Analysis
5. Reading Flow Classification
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import logging
from typing import Optional, Union, Dict, Any

from PIL import Image
import numpy as np

from schemas.crop import DetectedLayoutType, ReadingFlow, DetectTypeResponse
from services.image.utils.image_resolver import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.services.crop.detect_type")


async def detect_image_layout_type(url: Optional[str] = None, image_base64: Optional[str] = None) -> DetectTypeResponse:
    """
    Executes fast 5-layer computer vision layout analysis on a comic image.
    """
    start_time = time.perf_counter()
    raw_bytes = None

    if url:
        resolved = await resolve_image_to_buffer(url)
        raw_bytes = resolved.get("data")
    elif image_base64:
        import base64
        b64 = image_base64
        if "," in b64:
            b64 = b64.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64)

    if not raw_bytes:
        raise ValueError("Could not resolve image data for layout classification.")

    # ── 1. Open Image & Extract Basic Dimensions ─────────────────────────────
    with Image.open(io.BytesIO(raw_bytes)) as pil_img:
        width, height = pil_img.size
        # Downscale for ultra-fast CV matrix processing if image is very large
        target_w = 400
        scale = target_w / float(width) if width > target_w else 1.0
        target_h = max(10, int(height * scale))
        
        # Fast thumbnail for numpy analytics
        thumb = pil_img.resize((target_w, target_h), Image.Resampling.BILINEAR) if scale < 1.0 else pil_img
        gray = np.array(thumb.convert("L"))
        rgb = np.array(thumb.convert("RGB"))

    aspect_ratio = height / float(max(1, width))

    # ── 2. Background Color & Corner Palette Sampling ────────────────────────
    # Sample 4 corners (top-left, top-right, bottom-left, bottom-right)
    h_th, w_th = gray.shape
    corner_samples = [
        rgb[0:5, 0:5],
        rgb[0:5, w_th-5:w_th],
        rgb[h_th-5:h_th, 0:5],
        rgb[h_th-5:h_th, w_th-5:w_th],
    ]
    mean_corner_rgb = np.mean([np.mean(c, axis=(0, 1)) for c in corner_samples], axis=0)
    corner_brightness = float(np.mean(mean_corner_rgb))

    if corner_brightness > 220:
        detected_bg_color = "white"
    elif corner_brightness < 45:
        detected_bg_color = "black"
    else:
        # Convert mean RGB to hex
        r, g, b = [int(v) for v in mean_corner_rgb]
        detected_bg_color = f"#{r:02x}{g:02x}{b:02x}"

    # ── 3. Projection Profile & Horizontal Gutter Seam Analysis ──────────────
    # Horizontal projection profile: variance of each row
    row_variance = np.var(gray, axis=1)
    
    # Valleys indicate solid whitespace / black gutter dividers between panels
    is_gutter_row = row_variance < 8.0
    gutter_transitions = np.diff(is_gutter_row.astype(int))
    # Count transitions from content to gutter to estimate panel count
    estimated_valleys = int(np.sum(gutter_transitions == 1))
    
    # ── 4. Edge Complexity Score ─────────────────────────────────────────────
    # Gradient magnitude via simple Sobel-like diffs
    dy, dx = np.gradient(gray)
    edge_energy = float(np.mean(np.abs(dx) + np.abs(dy)))

    if edge_energy > 28.0:
        edge_complexity = "high"
        optimal_canny = {"low": 30, "high": 120}
    elif edge_energy < 12.0:
        edge_complexity = "low"
        optimal_canny = {"low": 15, "high": 80}
    else:
        edge_complexity = "medium"
        optimal_canny = {"low": 20, "high": 100}

    logger.debug(
        f"[DEBUG:DetectType] Input Image: {width}x{height}px | Aspect: {aspect_ratio:.3f} | "
        f"Corner Brightness: {corner_brightness:.1f} (BG: {detected_bg_color}) | "
        f"Gutter Transitions: {estimated_valleys} | Edge Energy: {edge_energy:.2f} (Complexity: {edge_complexity})"
    )

    # ── 5. Layer 5: Classification & Reading Flow Decision Tree ──────────────
    
    # Case A: Tall Webtoon Continuous Scroll Strip
    if aspect_ratio >= 2.5:
        crop_type = DetectedLayoutType.LONG_PANELS
        type_label = "Tall Webtoon Scroll"
        confidence = min(0.99, 0.90 + (aspect_ratio / 100.0))
        estimated_panel_count = max(2, estimated_valleys + 1)
        reading_flow = ReadingFlow.TOP_TO_BOTTOM
        recommended_endpoint = "/api/v1/images/crop/long-panels"
        suggested_strategy = "batch_slice"
        message = f"Continuous Webtoon strip detected ({width}x{height}px, ratio {aspect_ratio:.2f}) with ~{estimated_panel_count} estimated panels."

    # Case B: 2-Page Panoramic Double Spread
    elif aspect_ratio <= 0.75:
        crop_type = DetectedLayoutType.DOUBLE_PAGE_SPREAD
        type_label = "Double Page Spread"
        confidence = 0.95
        estimated_panel_count = max(1, estimated_valleys + 1)
        reading_flow = ReadingFlow.RIGHT_TO_LEFT
        recommended_endpoint = "/api/v1/images/crop/single-panels"
        suggested_strategy = "spread_split"
        message = f"Panoramic double-page spread detected ({width}x{height}px)."

    # Case C: 4-Koma Strip (Vertical 4-Panel Strip)
    elif 2.8 <= aspect_ratio <= 5.0 and estimated_valleys in (3, 4):
        crop_type = DetectedLayoutType.FOUR_KOMA
        type_label = "4-Koma Strip (Yonkoma)"
        confidence = 0.92
        estimated_panel_count = 4
        reading_flow = ReadingFlow.TOP_TO_BOTTOM
        recommended_endpoint = "/api/v1/images/crop/long-panels"
        suggested_strategy = "batch_slice"
        message = f"4-Koma vertical strip detected with 4 stacked panel frames."

    # Case D: Standard Manga / Comic Grid Page with Multiple Panels
    elif 1.25 < aspect_ratio < 2.5 and estimated_valleys >= 2:
        crop_type = DetectedLayoutType.MULTI_GRID_PAGE
        type_label = "Standard Manga Grid Page"
        confidence = 0.94
        estimated_panel_count = max(2, estimated_valleys + 1)
        reading_flow = ReadingFlow.RIGHT_TO_LEFT if detected_bg_color == "white" else ReadingFlow.LEFT_TO_RIGHT
        recommended_endpoint = "/api/v1/images/crop/single-panels"
        suggested_strategy = "grid_split"
        message = f"Standard comic page detected with ~{estimated_panel_count} grid panels."

    # Case E: Single Isolated Panel / Square Illustration / Small Panel
    else:
        crop_type = DetectedLayoutType.SMALL_PANELS
        type_label = "Small Panel"
        confidence = 0.90
        estimated_panel_count = 1
        reading_flow = ReadingFlow.LEFT_TO_RIGHT
        recommended_endpoint = "/api/v1/images/crop/small-panels"
        suggested_strategy = "margin_crop"
        message = f"Small panel frame / illustration ({width}x{height}px)."

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"[DetectType] Classified as '{crop_type.value}' ({width}x{height}px, ratio {aspect_ratio:.2f}) in {elapsed_ms}ms")
    logger.debug(f"[DEBUG:DetectType] Output Result: {crop_type.value} | Strategy: {suggested_strategy} | Canny: {optimal_canny} | Conf: {confidence:.2f}")

    return DetectTypeResponse(
        success=True,
        crop_type=crop_type,
        type_label=type_label,
        confidence=round(confidence, 2),
        width=width,
        height=height,
        aspect_ratio=round(aspect_ratio, 3),
        estimated_panel_count=estimated_panel_count,
        reading_flow=reading_flow,
        detected_bg_color=detected_bg_color,
        edge_complexity=edge_complexity,
        optimal_canny_thresholds=optimal_canny,
        recommended_endpoint=recommended_endpoint,
        suggested_strategy=suggested_strategy,
        message=message
    )
