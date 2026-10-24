"""
backend/features/image/transform/format_converter_service.py
─────────────────────────────────────────────────────────────────────────────
Format Converter Service:
- Converts image buffers between formats (JPEG, PNG, WebP, AVIF, TIFF, BMP)
- Automatic alpha channel flattening against custom background for JPEG
- Configurable compression quality and encoder optimization
─────────────────────────────────────────────────────────────────────────────
"""

import io
from typing import Tuple
from PIL import Image, ImageColor


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _normalize_format_name(fmt_str: str) -> str:
    """Normalizes format alias strings to PIL format identifiers."""
    cleaned = fmt_str.strip().upper()
    if cleaned in ("JPG", "JPEG"):
        return "JPEG"
    if cleaned in ("PNG",):
        return "PNG"
    if cleaned in ("WEBP",):
        return "WEBP"
    if cleaned in ("AVIF",):
        return "AVIF"
    if cleaned in ("TIF", "TIFF"):
        return "TIFF"
    if cleaned in ("BMP",):
        return "BMP"
    if cleaned in ("GIF",):
        return "GIF"
    return cleaned


def _flatten_alpha(img: Image.Image, bg_color: str = "white") -> Image.Image:
    """Composites an image with alpha transparency onto a solid color background."""
    if "A" not in img.mode and img.mode != "RGBA":
        return img.convert("RGB")

    try:
        rgb_color: Tuple[int, int, int] = ImageColor.getrgb(bg_color)
    except Exception:
        rgb_color = (255, 255, 255)

    background = Image.new("RGB", img.size, rgb_color)
    rgba_img = img.convert("RGBA")
    background.paste(rgba_img, mask=rgba_img.split()[3])
    return background


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def convert_image_format(
    image_bytes: bytes,
    target_format: str = "WEBP",
    quality: int = 85,
    optimize: bool = True,
    background_fill: str = "white"
) -> bytes:
    """
    Converts raw image bytes to the specified image format.

    Args:
        image_bytes: Raw input image buffer.
        target_format: Target format string ('WEBP', 'JPEG', 'PNG', 'AVIF').
        quality: Compression quality (1-100).
        optimize: Whether to apply PIL encoder optimization.
        background_fill: Fill color for transparent pixels when converting to JPEG.

    Returns:
        Converted image bytes in target format.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    fmt = _normalize_format_name(target_format)
    img = Image.open(io.BytesIO(image_bytes))

    # Formats that do not support alpha must be flattened
    if fmt in ("JPEG", "BMP"):
        img = _flatten_alpha(img, bg_color=background_fill)

    out = io.BytesIO()
    save_kwargs = {}

    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = max(1, min(100, quality))
        save_kwargs["optimize"] = optimize
    elif fmt == "PNG":
        save_kwargs["optimize"] = optimize
    elif fmt == "AVIF":
        save_kwargs["quality"] = max(1, min(100, quality))

    img.save(out, format=fmt, **save_kwargs)
    return out.getvalue()


__all__ = [
    "convert_image_format",
]
