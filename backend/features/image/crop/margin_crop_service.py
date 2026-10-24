"""
backend/features/image/crop/margin_crop_service.py
─────────────────────────────────────────────────────────────────────────────
4-Directional Margin Cropper for Single Images & Isolated Panels:
- Crops Top (crop_top), Bottom (crop_bottom), Left (crop_left), Right (crop_right)
- Supports percent (0-100%) and pixel offset units
- Integrates canonical Euclidean autotrim from features.image.utils.autotrim
- Aspect ratio snapping (9:16, 16:9, 1:1, 4:5)
─────────────────────────────────────────────────────────────────────────────
"""

import io
import math
from typing import Tuple, Dict, Any, Optional, Literal
from PIL import Image

from features.image.utils.autotrim import autotrim_solid_borders
from features.image.utils.box_utils import adjust_to_aspect_ratio


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _calculate_pixel_bounds(
    w: int,
    h: int,
    crop_top: float,
    crop_bottom: float,
    crop_left: float,
    crop_right: float,
    unit: str
) -> Tuple[int, int, int, int]:
    """Converts percentage or pixel margin offsets into absolute pixel crop bounds."""
    if unit == "pixels":
        top_px = max(0, min(h - 1, round(crop_top)))
        bot_px = max(0, min(h - 1, round(crop_bottom)))
        left_px = max(0, min(w - 1, round(crop_left)))
        right_px = max(0, min(w - 1, round(crop_right)))
    else:
        # Default: percentage (0-100)
        top_px = max(0, min(h - 1, round((crop_top / 100.0) * h)))
        bot_px = max(0, min(h - 1, round((crop_bottom / 100.0) * h)))
        left_px = max(0, min(w - 1, round((crop_left / 100.0) * w)))
        right_px = max(0, min(w - 1, round((crop_right / 100.0) * w)))

    x1 = left_px
    y1 = top_px
    x2 = max(x1 + 10, w - right_px)
    y2 = max(y1 + 10, h - bot_px)

    return x1, y1, min(w, x2), min(h, y2)


def _snap_image_to_aspect(img: Image.Image, aspect_ratio_str: str) -> Image.Image:
    """Snaps an image canvas to match requested aspect ratio with centered cropping."""
    if not aspect_ratio_str or aspect_ratio_str.lower() in ("free", "auto", "original"):
        return img

    w, h = img.size
    target_w, target_h = adjust_to_aspect_ratio(w, h, aspect_ratio_str)

    if target_w == w and target_h == h:
        return img

    left = max(0, (w - target_w) // 2)
    top = max(0, (h - target_h) // 2)
    right = min(w, left + target_w)
    bottom = min(h, top + target_h)

    return img.crop((left, top, right, bottom))


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def crop_panel_margins(
    image_bytes: bytes,
    crop_top: float = 0.0,
    crop_bottom: float = 0.0,
    crop_left: float = 0.0,
    crop_right: float = 0.0,
    unit: Literal["percent", "pixel"] = "percent",
    auto_trim: bool = False,
    aspect_ratio: Optional[str] = None,
    tolerance: int = 15,
    output_format: str = "PNG"
) -> Tuple[bytes, Dict[str, Any]]:
    """
    Crops directional margins from a single panel, applies Euclidean autotrim,
    and snaps to the requested aspect ratio.

    Args:
        image_bytes: Raw input image buffer.
        crop_top: Margin to crop from top (percent 0-100 or pixels).
        crop_bottom: Margin to crop from bottom.
        crop_left: Margin to crop from left.
        crop_right: Margin to crop from right.
        unit: 'percent' or 'pixel'.
        auto_trim: Whether to auto-detect and trim scanner background noise.
        aspect_ratio: Target aspect ratio lock ('free', '9:16', '16:9', '1:1', '4:5').
        tolerance: Euclidean color-distance tolerance for autotrim.
        output_format: Target format ('PNG', 'JPEG', 'WEBP').

    Returns:
        Tuple of (cropped_image_bytes, metadata_dict).
    """
    if not image_bytes:
        raise ValueError("Input image buffer cannot be empty.")

    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size

    # Step 1: Margin Crop
    has_margin_crop = (crop_top > 0 or crop_bottom > 0 or crop_left > 0 or crop_right > 0)
    if has_margin_crop:
        x1, y1, x2, y2 = _calculate_pixel_bounds(w, h, crop_top, crop_bottom, crop_left, crop_right, unit)
        img = img.crop((x1, y1, x2, y2))

    # Step 2: Auto Trim
    was_trimmed = False
    if auto_trim:
        img, _, was_trimmed = autotrim_solid_borders(img, tolerance=tolerance)

    # Step 3: Aspect Ratio Snap
    if aspect_ratio and aspect_ratio != "free":
        img = _snap_image_to_aspect(img, aspect_ratio)

    out_w, out_h = img.size

    # Step 4: Encode to buffer
    out_buf = io.BytesIO()
    fmt = output_format.upper()
    if fmt in ("JPG", "JPEG") and img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGB")
    img.save(out_buf, format=fmt, quality=92 if fmt in ("JPEG", "WEBP") else None)
    result_bytes = out_buf.getvalue()

    metadata = {
        "width": out_w,
        "height": out_h,
        "aspect_ratio": f"{out_w}:{out_h}",
        "auto_trimmed": was_trimmed,
        "format": fmt,
        "bytes_size": len(result_bytes),
    }

    return result_bytes, metadata


crop_single_panels_margins = crop_panel_margins

__all__ = [
    "crop_panel_margins",
    "crop_single_panels_margins",
]
