"""
backend/features/video/composition/frame_builder.py
─────────────────────────────────────────────────────────────────────────────
Frame composition, centering, letterboxing, and accelerated Gaussian blur fill.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from PIL import Image, ImageFilter
from typing import Tuple

logger = logging.getLogger("sonikoma.features.video.composition.frame_builder")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _calculate_letterbox_dims(
    src_w: int,
    src_h: int,
    target_w: int,
    target_h: int
) -> Tuple[int, int, int, int]:
    """Calculates scaling dimensions and centering offsets to fit panel in target canvas."""
    src_w = max(1, src_w)
    src_h = max(1, src_h)
    scale = min(target_w / src_w, target_h / src_h)
    new_w = max(1, int(src_w * scale))
    new_h = max(1, int(src_h * scale))
    offset_x = max(0, (target_w - new_w) // 2)
    offset_y = max(0, (target_h - new_h) // 2)
    return new_w, new_h, offset_x, offset_y


def _generate_blurred_fill(
    bg_image: Image.Image,
    target_w: int,
    target_h: int,
    blur_radius: int = 6
) -> Image.Image:
    """Downsamples image 4x, applies Gaussian blur, and resamples back for high performance."""
    blur_w = max(16, target_w // 4)
    blur_h = max(16, target_h // 4)
    bg_small = bg_image.resize((blur_w, blur_h), Image.Resampling.BILINEAR)
    bg_blurred = bg_small.filter(ImageFilter.GaussianBlur(blur_radius))
    return bg_blurred.resize((target_w, target_h), Image.Resampling.BILINEAR)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def build_frame(
    background_image: Image.Image,
    foreground_image: Image.Image,
    target_width: int = 1920,
    target_height: int = 1080,
) -> Image.Image:
    """Builds a centered frame with a blurred background fill."""
    target_width = max(1, target_width)
    target_height = max(1, target_height)

    bg_img = _generate_blurred_fill(background_image, target_width, target_height)

    img_w, img_h = foreground_image.size
    new_w, new_h, offset_x, offset_y = _calculate_letterbox_dims(img_w, img_h, target_width, target_height)

    fg_img = foreground_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    frame = bg_img.copy()
    frame.paste(fg_img, (offset_x, offset_y))
    return frame.convert("RGB")


# Backward compatibility alias
build_panel_frame_image = build_frame

__all__ = [
    "build_frame",
    "build_panel_frame_image",
]
