"""
backend/features/video/motion/parallax_engine.py
─────────────────────────────────────────────────────────────────────────────
2.5D multi-layer parallax motion synthesizing depth-separated comic layers.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image
from typing import Optional
from moviepy.editor import VideoClip


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _calculate_layer_offset(
    depth_factor: float,
    progress: float,
    max_offset_x: int,
    max_offset_y: int
) -> tuple[int, int]:
    """Calculates directional shift for a layer proportional to its depth factor."""
    ease = 0.5 - 0.5 * np.cos(progress * np.pi)
    dx = int((ease - 0.5) * max_offset_x * depth_factor)
    dy = int((ease - 0.5) * max_offset_y * depth_factor)
    return dx, dy


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def apply_parallax(
    background_img: Image.Image,
    character_img: Image.Image,
    text_img: Optional[Image.Image],
    target_width: int = 1920,
    target_height: int = 1080,
    duration: float = 3.5,
    parallax_intensity: float = 30.0,
    motion_type: str = "zoom_in"
) -> VideoClip:
    """Creates a 2.5D depth parallax video clip from separated image layers."""
    bg_resized = background_img.resize((target_width, target_height), Image.Resampling.BILINEAR).convert("RGBA")
    char_resized = character_img.resize((target_width, target_height), Image.Resampling.LANCZOS).convert("RGBA")
    txt_resized = text_img.resize((target_width, target_height), Image.Resampling.LANCZOS).convert("RGBA") if text_img else None

    max_shift = int(parallax_intensity)

    def make_frame_parallax(t: float):
        p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0

        # Background moves slower (depth = 0.4), Character moves normal (depth = 1.0), Text moves faster (depth = 1.3)
        bg_dx, bg_dy = _calculate_layer_offset(0.4, p, max_shift, max_shift // 2)
        char_dx, char_dy = _calculate_layer_offset(1.0, p, max_shift, max_shift // 2)

        canvas = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 255))
        canvas.paste(bg_resized, (bg_dx, bg_dy), bg_resized)
        canvas.paste(char_resized, (char_dx, char_dy), char_resized)

        if txt_resized:
            txt_dx, txt_dy = _calculate_layer_offset(1.3, p, max_shift, max_shift // 2)
            canvas.paste(txt_resized, (txt_dx, txt_dy), txt_resized)

        return np.array(canvas.convert("RGB"), dtype=np.uint8)

    return VideoClip(make_frame_parallax, duration=duration)


# Backward compatibility alias
build_parallax_motion_clip = apply_parallax

__all__ = [
    "apply_parallax",
    "build_parallax_motion_clip",
]
