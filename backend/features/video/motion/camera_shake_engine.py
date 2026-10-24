"""
backend/features/video/motion/camera_shake_engine.py
─────────────────────────────────────────────────────────────────────────────
Harmonic camera shake oscillation, explosion jitter, and impact animations.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image
from typing import Optional, Any
from moviepy.editor import VideoClip
from features.video.composition.frame_builder import build_frame
from features.video.composition.subtitle_overlay import create_subtitles


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _resolve_shake_amplitudes(intensity: str, target_w: int, target_h: int) -> tuple[int, int, float]:
    """Returns horizontal jitter, vertical jitter, and harmonic oscillation frequency."""
    level = intensity.lower().strip()
    if level == "low":
        return int(target_w * 0.015), int(target_h * 0.015), 18.0
    elif level == "high":
        return int(target_w * 0.05), int(target_h * 0.05), 36.0
    elif level == "extreme":
        return int(target_w * 0.08), int(target_h * 0.08), 44.0
    else:  # medium default
        return int(target_w * 0.03), int(target_h * 0.03), 26.0


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def apply_shake(
    img: Image.Image,
    target_width: int,
    target_height: int,
    duration: float,
    intensity: str = "medium",
    subtitle_text: Optional[str] = None
) -> VideoClip:
    """Creates a camera shake video clip for action panels."""
    composite_frame = build_frame(img, img, target_width, target_height)
    max_jx, max_jy, freq = _resolve_shake_amplitudes(intensity, target_width, target_height)

    oversize_w = target_width + max_jx * 2
    oversize_h = target_height + max_jy * 2
    oversized = composite_frame.resize((oversize_w, oversize_h), Image.Resampling.BILINEAR)
    arr = np.array(oversized, dtype=np.uint8)

    sub_overlay = create_subtitles(subtitle_text, target_width) if subtitle_text else None

    def make_frame_shake(t: float):
        decay = max(0.2, 1.0 - (t / duration) * 0.5) if duration > 0 else 1.0
        jx = int(np.sin(t * freq) * max_jx * decay)
        jy = int(np.cos(t * (freq * 0.75)) * max_jy * decay)
        x0 = max_jx + jx
        y0 = max_jy + jy
        frame = arr[y0:y0 + target_height, x0:x0 + target_width].copy()
        if sub_overlay:
            sub_overlay.apply_to(frame, target_width)
        return frame

    return VideoClip(make_frame_shake, duration=duration)


# Backward compatibility alias
build_camera_shake_clip = apply_shake

__all__ = [
    "apply_shake",
    "build_camera_shake_clip",
]
