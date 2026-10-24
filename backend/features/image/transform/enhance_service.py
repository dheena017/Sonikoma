"""
backend/features/image/transform/enhance_service.py
─────────────────────────────────────────────────────────────────────────────
Image Enhancement Service:
- Color grading: Brightness, Contrast, Saturation, and Sharpness
- Precision PIL ImageEnhance pipeline with full dynamic range preservation
─────────────────────────────────────────────────────────────────────────────
"""

import io
from PIL import Image, ImageEnhance


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _apply_enhancements(
    img: Image.Image,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    sharpness: float = 1.0
) -> Image.Image:
    """Sequentially applies color and detail enhancement factors."""
    res = img
    if brightness != 1.0:
        res = ImageEnhance.Brightness(res).enhance(brightness)
    if contrast != 1.0:
        res = ImageEnhance.Contrast(res).enhance(contrast)
    if saturation != 1.0:
        res = ImageEnhance.Color(res).enhance(saturation)
    if sharpness != 1.0:
        res = ImageEnhance.Sharpness(res).enhance(sharpness)
    return res


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def enhance_image(
    image_bytes: bytes,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0,
    sharpness: float = 1.0,
    output_format: str = "PNG"
) -> bytes:
    """
    Applies color grading and sharpness adjustments to an image.

    Args:
        image_bytes: Raw input image buffer.
        brightness: Brightness multiplier (1.0 = unchanged, <1.0 darker, >1.0 brighter).
        contrast: Contrast multiplier (1.0 = unchanged).
        saturation: Color saturation multiplier (0.0 = grayscale, 1.0 = normal).
        sharpness: Sharpness factor (1.0 = unchanged, >1.0 sharper).
        output_format: Target format ('PNG', 'JPEG', 'WEBP').

    Returns:
        Enhanced image bytes.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    # No-op check
    if brightness == 1.0 and contrast == 1.0 and saturation == 1.0 and sharpness == 1.0:
        return image_bytes

    img = Image.open(io.BytesIO(image_bytes))
    enhanced = _apply_enhancements(img, brightness, contrast, saturation, sharpness)

    out = io.BytesIO()
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"

    if fmt == "JPEG" and ("A" in enhanced.mode or enhanced.mode == "RGBA"):
        enhanced = enhanced.convert("RGB")

    enhanced.save(out, format=fmt)
    return out.getvalue()


__all__ = [
    "enhance_image",
]
