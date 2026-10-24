"""
backend/features/image/transform/rotate_service.py
─────────────────────────────────────────────────────────────────────────────
Image Rotation Service:
- Arbitrary angle rotation with canvas boundary expansion
- Clean background corner filling for transparent or solid backgrounds
- Fast-path 90°, 180°, and 270° transpositions
─────────────────────────────────────────────────────────────────────────────
"""

import io
from typing import Tuple, Union
from PIL import Image, ImageColor


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_fill_color(bg_color: str, has_alpha: bool) -> Union[Tuple[int, int, int, int], Tuple[int, int, int]]:
    """Resolves background color string into RGBA or RGB tuple."""
    if has_alpha:
        if bg_color.lower() in ("transparent", "none", ""):
            return (0, 0, 0, 0)
        rgb = ImageColor.getrgb(bg_color)
        return (rgb[0], rgb[1], rgb[2], 255)
    return ImageColor.getrgb(bg_color)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def rotate_image(
    image_bytes: bytes,
    angle: float,
    background_color: str = "white",
    expand: bool = True
) -> bytes:
    """
    Rotates an image by specified angle degrees.

    Args:
        image_bytes: Raw input image buffer.
        angle: Rotation angle in degrees (clockwise positive or counter-clockwise negative).
        background_color: Color string for newly exposed corner triangles (e.g. 'white', '#000000').
        expand: Whether to expand the output canvas to accommodate rotated corners.

    Returns:
        Rotated image bytes in PNG format.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    img = Image.open(io.BytesIO(image_bytes))

    # Fast path for right angles
    norm_angle = angle % 360
    if norm_angle == 90:
        rotated = img.transpose(Image.Transpose.ROTATE_270)
    elif norm_angle == 180:
        rotated = img.transpose(Image.Transpose.ROTATE_180)
    elif norm_angle == 270:
        rotated = img.transpose(Image.Transpose.ROTATE_90)
    elif norm_angle == 0:
        rotated = img
    else:
        has_alpha = "A" in img.mode or img.mode == "RGBA"
        if not has_alpha and background_color.lower() in ("transparent", "none"):
            img = img.convert("RGBA")
            has_alpha = True

        fill = _resolve_fill_color(background_color, has_alpha)
        # Note: PIL rotates counter-clockwise; negate angle for standard clockwise UX
        rotated = img.rotate(-angle, expand=expand, fillcolor=fill, resample=Image.Resampling.BICUBIC)

    out = io.BytesIO()
    rotated.save(out, format="PNG")
    return out.getvalue()


__all__ = [
    "rotate_image",
]
