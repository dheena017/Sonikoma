"""
backend/features/image/transform/background_remover_service.py
─────────────────────────────────────────────────────────────────────────────
Solid Background Remover Service:
- Converts solid or near-uniform backdrop colors to alpha transparency
- Auto-detects background color from image corners or accepts explicit RGB
- Euclidean color distance thresholding with antialiased edge smoothing
─────────────────────────────────────────────────────────────────────────────
"""

import io
import math
from typing import Optional, Tuple
from PIL import Image


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _sample_corner_color(img: Image.Image) -> Tuple[int, int, int]:
    """Samples top-left corner pixel as background reference."""
    rgb = img.convert("RGB")
    pixel = rgb.getpixel((0, 0))
    return (pixel[0], pixel[1], pixel[2])


def _apply_fuzz_transparency(
    img: Image.Image,
    target_rgb: Tuple[int, int, int],
    threshold: int
) -> Image.Image:
    """Replaces pixels matching target_rgb within threshold with transparent alpha."""
    rgba = img.convert("RGBA")
    datas = rgba.getdata()
    r_target, g_target, b_target = target_rgb

    new_data = []
    for item in datas:
        r, g, b, a = item
        # Euclidean distance in RGB space
        dist = math.sqrt((r - r_target) ** 2 + (g - g_target) ** 2 + (b - b_target) ** 2)
        if dist < threshold:
            # Soft feathered edge near threshold
            if threshold > 5 and dist > threshold - 5:
                feather_alpha = int(255 * ((dist - (threshold - 5)) / 5))
                new_data.append((r, g, b, min(a, feather_alpha)))
            else:
                new_data.append((r, g, b, 0))
        else:
            new_data.append(item)

    rgba.putdata(new_data)
    return rgba


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def remove_solid_background(
    image_bytes: bytes,
    fuzz_threshold: int = 30,
    target_color: Optional[Tuple[int, int, int]] = None
) -> bytes:
    """
    Replaces a solid background color with transparent alpha.

    Args:
        image_bytes: Raw input image buffer.
        fuzz_threshold: Tolerance for color matching (default: 30).
        target_color: Optional explicit RGB tuple (e.g. (255, 255, 255)).
                     If None, samples from top-left corner.

    Returns:
        Image bytes in PNG format with transparent alpha channel.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    img = Image.open(io.BytesIO(image_bytes))

    ref_color = target_color if target_color is not None else _sample_corner_color(img)
    result = _apply_fuzz_transparency(img, ref_color, fuzz_threshold)

    out = io.BytesIO()
    result.save(out, format="PNG")
    return out.getvalue()


__all__ = [
    "remove_solid_background",
]
