"""
backend/features/image_editor/services/detector/detect_type_service.py
─────────────────────────────────────────────────────────────────────────────
5-Layer Comic Layout & Reading Flow Classifier Service:

1. Geometric & Aspect Ratio Analysis:
   - Evaluates image dimensions (W x H) and vertical aspect ratios.
   - Downsamples high-resolution canvas to standardized matrix width for CV speed.

2. Background Color & Corner Palette Scanner:
   - Samples 4 corners (top-left, top-right, bottom-left, bottom-right).
   - Discriminates pure white, deep black, or dominant background hex tones.

3. Projection Profile & Horizontal Gutter Seam Analysis:
   - Computes row-wise variance across grayscale projection profiles.
   - Identifies low-variance gutter seams and whitespace transitions between panels.

4. Spatial Edge Complexity & Canny Parameter Optimizer:
   - Computes 2D image gradients to quantify visual density and line energy.
   - Dynamically recommends optimal Canny edge detection thresholds.

5. Reading Flow & Format Classification Decision Tree:
   - Maps extracted visual features to standardized Comic/Webtoon layout formats:
     * Ultra-Long Webtoon Continuous Scroll (Whole Chapter)
     * Tall Webtoon Continuous Scroll Strip
     * 2-Page Panoramic Double Spread
     * 4-Koma Strip (Vertical 4-Panel Yonkoma)
     * Standard Manga / Comic Grid Page
     * Single Isolated Frame / Small Panel
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import io
import time
import base64
import logging
from typing import Optional, Union, Dict, Any, Tuple

# Ensure backend root directory is in sys.path when executed directly
_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from PIL import Image
import numpy as np

from features.image_editor.schemas import (
    DetectedLayoutType,
    ReadingFlow,
    DetectTypeRequest,
    DetectTypeResponse,
)
from common.media import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.services.image.detector.detect_type")

__all__ = [
    "detect_image_layout_type",
    "sample_background_palette",
    "analyze_horizontal_gutters",
    "calculate_edge_complexity",
    "classify_layout_decision_tree",
]


# ─────────────────────────────────────────────────────────────────────────────
# Layer 2: Corner & Background Palette Sampling
# ─────────────────────────────────────────────────────────────────────────────

def sample_background_palette(rgb_matrix: np.ndarray) -> Tuple[str, float]:
    """
    Samples image corner patches to detect dominant canvas background color.

    Args:
        rgb_matrix (np.ndarray): 3-channel RGB image matrix.

    Returns:
        Tuple[str, float]: Detected background color ("white", "black", or hex "#rrggbb")
                           and corner brightness level (0.0 to 255.0).
    """
    h, w, _ = rgb_matrix.shape
    pad_h = max(1, min(5, h))
    pad_w = max(1, min(5, w))

    corner_samples = [
        rgb_matrix[0:pad_h, 0:pad_w],
        rgb_matrix[0:pad_h, max(0, w - pad_w):w],
        rgb_matrix[max(0, h - pad_h):h, 0:pad_w],
        rgb_matrix[max(0, h - pad_h):h, max(0, w - pad_w):w],
    ]

    corner_means = [np.mean(c, axis=(0, 1)) for c in corner_samples if c.size > 0]
    if not corner_means:
        logger.warning("[DetectType] Corner sampling patch is empty. Falling back to default 'white' background.")
        return "white", 255.0

    mean_corner_rgb = np.mean(corner_means, axis=0)
    corner_brightness = float(np.mean(mean_corner_rgb))

    if corner_brightness > 220:
        detected_bg_color = "white"
    elif corner_brightness < 45:
        detected_bg_color = "black"
    else:
        r, g, b = [int(np.clip(v, 0, 255)) for v in mean_corner_rgb]
        detected_bg_color = f"#{r:02x}{g:02x}{b:02x}"

    logger.debug(
        f"[DetectType] Background sampled: brightness={corner_brightness:.1f}, "
        f"mean_rgb=({mean_corner_rgb[0]:.1f}, {mean_corner_rgb[1]:.1f}, {mean_corner_rgb[2]:.1f}), "
        f"detected_color='{detected_bg_color}'"
    )
    return detected_bg_color, corner_brightness


# ─────────────────────────────────────────────────────────────────────────────
# Layer 3: Projection Profile & Horizontal Gutter Seam Analysis
# ─────────────────────────────────────────────────────────────────────────────

def analyze_horizontal_gutters(gray_matrix: np.ndarray) -> Tuple[int, float, int]:
    """
    Analyzes horizontal grayscale projection profiles to detect whitespace gutters and valleys.

    Args:
        gray_matrix (np.ndarray): 2D grayscale image matrix.

    Returns:
        Tuple[int, float, int]: (estimated_valleys, gutter_ratio, gutter_row_count)
    """
    if hasattr(gray_matrix, "convert"):
        gray_matrix = np.array(gray_matrix.convert("L"))
    elif not isinstance(gray_matrix, np.ndarray):
        gray_matrix = np.array(gray_matrix)

    h, w = gray_matrix.shape
    if h == 0 or w == 0:
        logger.warning("[DetectType] Grayscale matrix has zero dimension. Gutter analysis skipped.")
        return 0, 0.0, 0

    # Horizontal projection profile: variance of each row
    row_variance = np.var(gray_matrix, axis=1)

    # Low variance rows indicate solid white or black gutter dividers between comic panels
    is_gutter_row = row_variance < 8.0
    gutter_row_count = int(np.sum(is_gutter_row))
    gutter_ratio = float(gutter_row_count / float(max(1, h)))

    # Transitions from content row to gutter row estimate discrete panel transitions
    gutter_transitions = np.diff(is_gutter_row.astype(int))
    estimated_valleys = int(np.sum(gutter_transitions == 1))

    logger.debug(
        f"[DetectType] Gutter analysis: rows={h}, gutter_rows={gutter_row_count} "
        f"({gutter_ratio * 100:.1f}%), estimated_valleys={estimated_valleys}, "
        f"row_var_min={float(np.min(row_variance)):.1f}, row_var_mean={float(np.mean(row_variance)):.1f}"
    )

    if gutter_ratio > 0.90:
        logger.warning(
            f"[DetectType] Unusually high gutter ratio ({gutter_ratio * 100:.1f}%). "
            "Image may consist almost entirely of solid whitespace or empty background."
        )

    return estimated_valleys, gutter_ratio, gutter_row_count


# ─────────────────────────────────────────────────────────────────────────────
# Layer 4: Spatial Edge Complexity Analysis
# ─────────────────────────────────────────────────────────────────────────────

def calculate_edge_complexity(gray_matrix: np.ndarray) -> Tuple[str, Dict[str, int], float]:
    """
    Measures spatial gradient energy to determine visual edge complexity and optimal Canny parameters.

    Args:
        gray_matrix (np.ndarray): 2D grayscale image matrix.

    Returns:
        Tuple[str, Dict[str, int], float]: (edge_complexity, optimal_canny_thresholds, edge_energy)
    """
    h, w = gray_matrix.shape
    if h < 2 or w < 2:
        logger.warning("[DetectType] Image matrix too small for gradient computation. Returning low complexity.")
        return "low", {"low": 15, "high": 80}, 0.0

    dy, dx = np.gradient(gray_matrix.astype(np.float32))
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
        f"[DetectType] Edge complexity: energy={edge_energy:.2f} -> category='{edge_complexity}', "
        f"canny={optimal_canny}"
    )

    if edge_energy < 1.0:
        logger.warning(
            f"[DetectType] Very low edge energy ({edge_energy:.2f}). "
            "Image appears to lack detailed linework or artwork."
        )

    return edge_complexity, optimal_canny, edge_energy


# ─────────────────────────────────────────────────────────────────────────────
# Layer 5: Classification & Reading Flow Decision Tree
# ─────────────────────────────────────────────────────────────────────────────

def classify_layout_decision_tree(
    width: int,
    height: int,
    aspect_ratio: float,
    estimated_valleys: int,
    detected_bg_color: str,
    edge_complexity: str,
) -> Dict[str, Any]:
    """
    Evaluates geometric aspect ratio, gutter counts, and color patterns against comic format profiles.

    Args:
        width (int): Image width in pixels.
        height (int): Image height in pixels.
        aspect_ratio (float): Height-to-width ratio.
        estimated_valleys (int): Detected panel transition valleys.
        detected_bg_color (str): Background color classification.
        edge_complexity (str): Edge complexity level.

    Returns:
        Dict[str, Any]: Classification outcome fields.
    """
    # Case A1: Giant / Ultra-Long Webtoon Continuous Scroll (Whole Chapter / 10-50+ Panels)
    if aspect_ratio >= 5.5 or (aspect_ratio >= 3.5 and height >= 4000):
        crop_type = DetectedLayoutType.ULTRA_LONG_PANELS
        type_label = "Ultra-Long Chapter Webtoon Scroll"
        confidence = 0.99
        estimated_panel_count = max(8, estimated_valleys + 1)
        reading_flow = ReadingFlow.TOP_TO_BOTTOM
        recommended_endpoint = "/api/v1/panels/detect/long-panels"
        suggested_strategy = "sliding_window_slice"
        message = (
            f"Ultra-long chapter scroll detected ({width}x{height}px, ratio {aspect_ratio:.1f}) "
            f"with ~{estimated_panel_count} estimated panels."
        )
        logger.debug(
            f"[DetectType] Rule matched: Case A1 (Ultra-Long Webtoon) - ratio={aspect_ratio:.2f}, height={height}px"
        )

    # Case A2: Standard Tall Webtoon Continuous Scroll Strip (2-5 Panels)
    elif aspect_ratio >= 2.2:
        crop_type = DetectedLayoutType.LONG_PANELS
        type_label = "Tall Webtoon Scroll"
        confidence = min(0.99, 0.90 + (aspect_ratio / 100.0))
        estimated_panel_count = max(2, estimated_valleys + 1)
        reading_flow = ReadingFlow.TOP_TO_BOTTOM
        recommended_endpoint = "/api/v1/panels/detect/long-panels"
        suggested_strategy = "batch_slice"
        message = (
            f"Continuous Webtoon strip detected ({width}x{height}px, ratio {aspect_ratio:.2f}) "
            f"with ~{estimated_panel_count} estimated panels."
        )
        logger.debug(
            f"[DetectType] Rule matched: Case A2 (Tall Webtoon Scroll) - ratio={aspect_ratio:.2f}, height={height}px"
        )

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
        logger.debug(
            f"[DetectType] Rule matched: Case B (Double Page Spread) - ratio={aspect_ratio:.2f}"
        )

    # Case C: 4-Koma Strip (Vertical 4-Panel Strip)
    elif 2.8 <= aspect_ratio <= 5.0 and estimated_valleys in (3, 4):
        crop_type = DetectedLayoutType.FOUR_KOMA
        type_label = "4-Koma Strip (Yonkoma)"
        confidence = 0.92
        estimated_panel_count = 4
        reading_flow = ReadingFlow.TOP_TO_BOTTOM
        recommended_endpoint = "/api/v1/images/crop/long-panels"
        suggested_strategy = "batch_slice"
        message = "4-Koma vertical strip detected with 4 stacked panel frames."
        logger.debug(
            f"[DetectType] Rule matched: Case C (4-Koma Strip) - ratio={aspect_ratio:.2f}, valleys={estimated_valleys}"
        )

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
        logger.debug(
            f"[DetectType] Rule matched: Case D (Multi-Grid Page) - ratio={aspect_ratio:.2f}, valleys={estimated_valleys}"
        )

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
        logger.debug(
            f"[DetectType] Rule matched: Case E (Small Panel fallback) - ratio={aspect_ratio:.2f}, valleys={estimated_valleys}"
        )

    # Contextual warnings for potential edge cases
    if aspect_ratio >= 2.0 and estimated_valleys == 0:
        logger.warning(
            f"[DetectType] Tall strip layout (ratio {aspect_ratio:.2f}) without distinct horizontal gutters detected. "
            "Continuous bleed artwork, dark themes, or borderless panels may be present."
        )

    if aspect_ratio > 30.0:
        logger.warning(
            f"[DetectType] Extreme vertical aspect ratio detected ({aspect_ratio:.1f}). "
            "Sliding window processing is strongly recommended to prevent memory overhead."
        )
    elif aspect_ratio < 0.3:
        logger.warning(
            f"[DetectType] Extreme horizontal aspect ratio detected ({aspect_ratio:.2f}). "
            "Unusually wide panoramic strip or composite banner."
        )

    return {
        "crop_type": crop_type,
        "type_label": type_label,
        "confidence": confidence,
        "estimated_panel_count": estimated_panel_count,
        "reading_flow": reading_flow,
        "recommended_endpoint": recommended_endpoint,
        "suggested_strategy": suggested_strategy,
        "message": message,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Primary Layout Classifier Orchestrator
# ─────────────────────────────────────────────────────────────────────────────

async def detect_image_layout_type(
    url: Optional[str] = None,
    image_base64: Optional[str] = None,
    raw_bytes: Optional[bytes] = None,
    pil_image: Optional[Image.Image] = None,
    request: Optional[DetectTypeRequest] = None,
) -> DetectTypeResponse:
    """
    Executes fast 5-layer computer vision layout analysis on a comic image.

    Args:
        url (Optional[str]): Remote image URL or local storage path.
        image_base64 (Optional[str]): Base64-encoded image string (with or without data URI header).
        raw_bytes (Optional[bytes]): Direct binary byte buffer.
        pil_image (Optional[Image.Image]): Pre-loaded PIL Image instance.
        request (Optional[DetectTypeRequest]): Pydantic request wrapper object.

    Returns:
        DetectTypeResponse: Comprehensive layout analysis with reading flow, palette, and endpoint recommendation.

    Raises:
        ValueError: If input image data cannot be resolved or is corrupted.
    """
    start_time = time.perf_counter()

    # Extract parameters from request object if supplied
    if request is not None:
        if not url:
            url = request.url
        if not image_base64:
            image_base64 = request.image_base64

    # ── Stage 1: Input Resolution & Guard Clauses ────────────────────────────
    if pil_image is not None:
        logger.debug("[DetectType] Processing pre-loaded PIL Image instance.")
        working_img = pil_image.convert("RGB") if pil_image.mode not in ("RGB", "L") else pil_image
    elif raw_bytes is not None:
        logger.debug(f"[DetectType] Processing raw binary buffer ({len(raw_bytes)} bytes).")
        try:
            with Image.open(io.BytesIO(raw_bytes)) as loaded_img:
                working_img = loaded_img.convert("RGB") if loaded_img.mode not in ("RGB", "L") else loaded_img.copy()
        except Exception as e:
            logger.warning(f"[DetectType] Failed to decode raw image bytes: {e}")
            raise ValueError(f"Failed to decode image data: {e}") from e
    elif url:
        logger.debug(f"[DetectType] Resolving image from URL: {url[:100]}...")
        resolved = await resolve_image_to_buffer(url)
        buf_data = resolved.get("data")
        if not buf_data:
            logger.warning(f"[DetectType] Could not resolve image buffer from URL: {url}")
            raise ValueError(f"Could not resolve image data from URL: {url}")
        try:
            with Image.open(io.BytesIO(buf_data)) as loaded_img:
                working_img = loaded_img.convert("RGB") if loaded_img.mode not in ("RGB", "L") else loaded_img.copy()
        except Exception as e:
            logger.warning(f"[DetectType] Failed to parse image from URL '{url}': {e}")
            raise ValueError(f"Invalid image content retrieved from URL: {e}") from e
    elif image_base64:
        clean_b64 = image_base64.strip()
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",", 1)[1]
        logger.debug(f"[DetectType] Decoding base64 payload ({len(clean_b64)} chars)...")
        try:
            decoded_bytes = base64.b64decode(clean_b64)
            with Image.open(io.BytesIO(decoded_bytes)) as loaded_img:
                working_img = loaded_img.convert("RGB") if loaded_img.mode not in ("RGB", "L") else loaded_img.copy()
        except Exception as e:
            logger.warning(f"[DetectType] Failed to decode base64 image data: {e}")
            raise ValueError(f"Invalid base64 image payload: {e}") from e
    else:
        logger.warning("[DetectType] No image input provided (url, image_base64, raw_bytes, or pil_image).")
        raise ValueError("Could not resolve image data for layout classification: missing input source.")

    # ── Stage 2: Geometric Dimensions & Fast Downscaling ─────────────────────
    width, height = working_img.size
    if width <= 0 or height <= 0:
        logger.warning(f"[DetectType] Degenerate image dimensions received: {width}x{height}px.")
        raise ValueError(f"Degenerate image dimensions: {width}x{height}px.")

    if width < 50 or height < 50:
        logger.warning(f"[DetectType] Image dimensions are unusually small ({width}x{height}px). Accuracy may be impaired.")

    aspect_ratio = height / float(max(1, width))

    # Downscale for ultra-fast CV matrix processing if image is wide
    target_w = 400
    scale = target_w / float(width) if width > target_w else 1.0
    target_h = max(10, int(height * scale))

    # Fast thumbnail for numpy analytics
    if scale < 1.0:
        thumb = working_img.resize((target_w, target_h), Image.Resampling.BILINEAR)
    else:
        thumb = working_img

    gray = np.array(thumb.convert("L"))
    rgb = np.array(thumb.convert("RGB"))

    logger.debug(
        f"[DetectType] Geometric Layer: original={width}x{height}px (ratio={aspect_ratio:.3f}), "
        f"thumb={target_w}x{target_h}px (scale={scale:.3f})"
    )

    # ── Stage 3: Background Color & Corner Palette Sampling ──────────────────
    detected_bg_color, corner_brightness = sample_background_palette(rgb)

    # ── Stage 4: Projection Profile & Horizontal Gutter Seams ────────────────
    estimated_valleys, gutter_ratio, gutter_row_count = analyze_horizontal_gutters(gray)

    # ── Stage 5: Edge Complexity & Canny Optimization ────────────────────────
    edge_complexity, optimal_canny, edge_energy = calculate_edge_complexity(gray)

    # ── Stage 6: Format Classification & Reading Flow Decision Tree ──────────
    classification = classify_layout_decision_tree(
        width=width,
        height=height,
        aspect_ratio=aspect_ratio,
        estimated_valleys=estimated_valleys,
        detected_bg_color=detected_bg_color,
        edge_complexity=edge_complexity,
    )

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(
        f"[DetectType] Classified as '{classification['crop_type'].value}' "
        f"({classification['type_label']}, {width}x{height}px, ratio {aspect_ratio:.2f}, "
        f"conf={classification['confidence']:.2f}, valleys={estimated_valleys}) in {elapsed_ms}ms"
    )

    return DetectTypeResponse(
        success=True,
        crop_type=classification["crop_type"],
        type_label=classification["type_label"],
        confidence=round(classification["confidence"], 2),
        width=width,
        height=height,
        aspect_ratio=round(aspect_ratio, 3),
        estimated_panel_count=classification["estimated_panel_count"],
        reading_flow=classification["reading_flow"],
        detected_bg_color=detected_bg_color,
        edge_complexity=edge_complexity,
        optimal_canny_thresholds=optimal_canny,
        recommended_endpoint=classification["recommended_endpoint"],
        suggested_strategy=classification["suggested_strategy"],
        message=classification["message"],
    )

