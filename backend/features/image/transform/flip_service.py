"""
backend/features/image/transform/flip_service.py
─────────────────────────────────────────────────────────────────────────────
Image Flipping Service:
- High-performance horizontal (mirror) and vertical flipping
- Preserves full color profile, alpha channel, and image depth
─────────────────────────────────────────────────────────────────────────────
"""

import io
from PIL import Image


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _apply_mirror_flip(img: Image.Image, horizontal: bool, vertical: bool) -> Image.Image:
    """Applies horizontal and/or vertical transposition in-memory."""
    res = img
    if horizontal:
        res = res.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if vertical:
        res = res.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
    return res


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def flip_image(
    image_bytes: bytes,
    horizontal: bool = True,
    vertical: bool = False,
    output_format: str = "PNG"
) -> bytes:
    """
    Flips an image horizontally, vertically, or both.

    Args:
        image_bytes: Raw input image buffer.
        horizontal: Whether to mirror flip left-to-right (default: True).
        vertical: Whether to flip top-to-bottom (default: False).
        output_format: Target format ('PNG', 'JPEG', 'WEBP').

    Returns:
        Flipped image bytes.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    if not horizontal and not vertical:
        return image_bytes

    img = Image.open(io.BytesIO(image_bytes))
    flipped = _apply_mirror_flip(img, horizontal=horizontal, vertical=vertical)

    out = io.BytesIO()
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"

    if fmt == "JPEG" and ("A" in flipped.mode or flipped.mode == "RGBA"):
        flipped = flipped.convert("RGB")

    flipped.save(out, format=fmt)
    return out.getvalue()


__all__ = [
    "flip_image",
]
