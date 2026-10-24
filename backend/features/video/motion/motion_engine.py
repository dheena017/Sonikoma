"""
backend/features/video/motion/motion_engine.py
─────────────────────────────────────────────────────────────────────────────
Cinematic camera motion engine for motion comic video clips.
Supports optical zoom in/out, directional pans, camera shake, and static views.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image
from typing import Optional, Tuple, Any

from moviepy.editor import ImageClip, VideoClip
from features.video.composition.frame_builder import build_frame
from features.video.composition.subtitle_overlay import create_subtitles


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _normalize_motion_type(motion_type: Optional[str], aspect_ratio: float, idx: int) -> str:
    """Resolves and normalizes user motion preference into a canonical motion string."""
    norm = ""
    if motion_type:
        norm = str(motion_type).strip().lower().replace("-", "_").replace(" ", "_")

    if not norm or norm in ("auto", "default"):
        if aspect_ratio >= 1.25:
            return "pan_down"
        return "zoom_in" if (idx % 2 == 0) else "zoom_out"
    elif norm in ("zoom_in", "slow_zoom_in", "zoomin"):
        return "zoom_in"
    elif norm in ("zoom_out", "slow_zoom_out", "zoomout"):
        return "zoom_out"
    elif norm in ("pan_down", "pandown"):
        return "pan_down"
    elif norm in ("pan_up", "panup"):
        return "pan_up"
    elif norm in ("pan_right", "panright"):
        return "pan_right"
    elif norm in ("pan_left", "panleft"):
        return "pan_left"
    elif norm in ("shake", "camera_shake", "camerashake"):
        return "camera_shake"
    elif norm in ("static", "none", "static_view", "staticview"):
        return "static"
    return "zoom_in" if (idx % 2 == 0) else "zoom_out"


def _apply_overlay_if_present(frame: np.ndarray, overlay: Any, target_width: int):
    """Applies precomputed subtitle overlay onto numpy frame if active."""
    if not overlay:
        return
    if hasattr(overlay, "apply_to"):
        overlay.apply_to(frame, target_width)
    else:
        rgb, alpha = overlay
        h_b = rgb.shape[0]
        frame[-h_b:, 0:target_width] = (
            frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
        ).astype(np.uint8)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def apply_motion(
    img: Image.Image,
    target_width: int,
    target_height: int,
    duration: float,
    idx: int,
    motion_type: Optional[str] = None,
    subtitle_text: Optional[str] = None
) -> Tuple[Any, str]:
    """Applies camera motion (pan, zoom, shake, static) to an image and returns a video clip."""
    img_w, img_h = img.size
    aspect_ratio = img_h / max(1, img_w)
    sub_overlay = create_subtitles(subtitle_text, target_width) if subtitle_text else None
    effective_motion = _normalize_motion_type(motion_type, aspect_ratio, idx)

    # CASE 1: Vertical Manhwa pan_down / pan_up (aspect_ratio >= 1.25)
    if effective_motion in ("pan_down", "pan_up") and aspect_ratio >= 1.25:
        scale = target_width / img_w
        scaled_w = target_width
        scaled_h = max(target_height, int(img_h * scale))
        scaled_img = img.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)
        arr = np.array(scaled_img, dtype=np.uint8)
        max_scroll_y = max(0, scaled_h - target_height)

        def make_frame_scroll(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "pan_up":
                ease = 1.0 - ease
            y0 = int(ease * max_scroll_y)
            y1 = y0 + target_height
            if y1 <= scaled_h:
                frame = arr[y0:y1, 0:target_width].copy()
            else:
                frame = arr[scaled_h - target_height:scaled_h, 0:target_width].copy()
            _apply_overlay_if_present(frame, sub_overlay, target_width)
            return frame

        return VideoClip(make_frame_scroll, duration=duration), effective_motion

    # CASE 2: Pan Down / Up for standard aspect ratio
    elif effective_motion in ("pan_down", "pan_up"):
        composite_frame = build_frame(img, img, target_width, target_height)
        oversize_h = int(target_height * 1.12)
        oversized = composite_frame.resize((target_width, oversize_h), Image.Resampling.BILINEAR)
        arr = np.array(oversized, dtype=np.uint8)
        max_dy = oversize_h - target_height

        def make_frame_v_pan(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "pan_up":
                ease = 1.0 - ease
            y0 = int(ease * max_dy)
            frame = arr[y0:y0 + target_height, 0:target_width].copy()
            _apply_overlay_if_present(frame, sub_overlay, target_width)
            return frame

        return VideoClip(make_frame_v_pan, duration=duration), effective_motion

    # CASE 3: Pan Right / Left
    elif effective_motion in ("pan_right", "pan_left"):
        composite_frame = build_frame(img, img, target_width, target_height)
        oversize_w = int(target_width * 1.12)
        oversized = composite_frame.resize((oversize_w, target_height), Image.Resampling.BILINEAR)
        arr = np.array(oversized, dtype=np.uint8)
        max_dx = oversize_w - target_width

        def make_frame_h_pan(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "pan_left":
                ease = 1.0 - ease
            x0 = int(ease * max_dx)
            frame = arr[0:target_height, x0:x0 + target_width].copy()
            _apply_overlay_if_present(frame, sub_overlay, target_width)
            return frame

        return VideoClip(make_frame_h_pan, duration=duration), effective_motion

    # CASE 4: Camera Shake
    elif effective_motion == "camera_shake":
        composite_frame = build_frame(img, img, target_width, target_height)
        oversize_w = int(target_width * 1.06)
        oversize_h = int(target_height * 1.06)
        oversized = composite_frame.resize((oversize_w, oversize_h), Image.Resampling.BILINEAR)
        arr = np.array(oversized, dtype=np.uint8)
        max_jitter_x = (oversize_w - target_width) // 2
        max_jitter_y = (oversize_h - target_height) // 2

        def make_frame_shake(t):
            decay = max(0.1, 1.0 - (t / duration) * 0.4) if duration > 0 else 1.0
            jx = int(np.sin(t * 32.0) * max_jitter_x * decay)
            jy = int(np.cos(t * 24.0) * max_jitter_y * decay)
            x0 = max_jitter_x + jx
            y0 = max_jitter_y + jy
            frame = arr[y0:y0 + target_height, x0:x0 + target_width].copy()
            _apply_overlay_if_present(frame, sub_overlay, target_width)
            return frame

        return VideoClip(make_frame_shake, duration=duration), effective_motion

    # CASE 5: Static Stationary Frame
    elif effective_motion == "static":
        composite_frame = build_frame(img, img, target_width, target_height)
        arr = np.array(composite_frame, dtype=np.uint8)
        _apply_overlay_if_present(arr, sub_overlay, target_width)
        return ImageClip(arr).set_duration(duration), effective_motion

    # CASE 6: Zoom In / Zoom Out (Default)
    else:
        composite_frame = build_frame(img, img, target_width, target_height)
        zoom_margin = 0.12
        oversize_w = int(target_width * (1.0 + zoom_margin))
        oversize_h = int(target_height * (1.0 + zoom_margin))
        oversized = composite_frame.resize((oversize_w, oversize_h), Image.Resampling.BILINEAR)
        arr = np.array(oversized, dtype=np.uint8)

        def make_frame_zoom(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = p * p * (3.0 - 2.0 * p)  # Smoothstep
            scale_factor = (1.0 + ease * zoom_margin) if effective_motion == "zoom_in" else (1.0 + (1.0 - ease) * zoom_margin)
            cw = int(target_width * scale_factor)
            ch = int(target_height * scale_factor)
            x0 = max(0, (oversize_w - cw) // 2)
            y0 = max(0, (oversize_h - ch) // 2)
            crop_slice = arr[y0:y0 + ch, x0:x0 + cw]
            cropped_img = Image.fromarray(crop_slice)
            frame_img = cropped_img.resize((target_width, target_height), Image.Resampling.BILINEAR)
            frame = np.array(frame_img, dtype=np.uint8)
            _apply_overlay_if_present(frame, sub_overlay, target_width)
            return frame

        return VideoClip(make_frame_zoom, duration=duration), effective_motion


# Backward compatibility alias
build_cinematic_motion_clip = apply_motion

__all__ = [
    "apply_motion",
    "build_cinematic_motion_clip",
]
