"""
backend/features/video_editor/video/services/motion_engine.py
─────────────────────────────────────────────────────────────────────────────
Cinematic camera motion engine for motion comic video clips.
Supports optical zoom in/out, directional pans, camera shake, and static views.
─────────────────────────────────────────────────────────────────────────────
"""

import numpy as np
from PIL import Image
from typing import Optional, Tuple, Any

try:
    import cv2
except ImportError:
    cv2 = None

from moviepy.editor import ImageClip, VideoClip
from common.video import CinematicMotionType, VALID_MOTIONS
from features.video_editor.video.services.frame_builder import (
    build_panel_frame_image,
    create_subtitle_overlay,
)


def build_cinematic_motion_clip(
    img: Image.Image,
    target_width: int,
    target_height: int,
    duration: float,
    idx: int,
    motion_type: Optional[str] = None,
    subtitle_text: Optional[str] = None
) -> Tuple[Any, str]:
    """
    Constructs a high-performance cinematic motion clip adhering strictly to the panel's configured motion:
    - zoom_in: Smooth optical zoom in towards center (1.0x -> 1.12x).
    - zoom_out: Smooth optical zoom out from center (1.12x -> 1.0x).
    - pan_down: Smooth vertical scroll downwards (full-width for tall manhwa or oversized canvas).
    - pan_up: Smooth vertical scroll upwards.
    - pan_right: Smooth horizontal pan from left to right.
    - pan_left: Smooth horizontal pan from right to left.
    - camera_shake: Impact oscillation shake (sine harmonic jitter).
    - static: Clean stationary frame.
    - None/unset: Auto-selects pan_down for tall vertical manhwa, or alternating zoom for landscape.
    """
    img_w, img_h = img.size
    aspect_ratio = img_h / max(1, img_w)
    sub_overlay = create_subtitle_overlay(subtitle_text, target_width) if subtitle_text else None

    # Normalize motion type
    norm_motion = ""
    if motion_type:
        norm_motion = (
            str(motion_type)
            .strip()
            .lower()
            .replace("-", "_")
            .replace(" ", "_")
        )

    # Resolve effective motion
    if not norm_motion or norm_motion in ("auto", "default"):
        if aspect_ratio >= 1.25:
            effective_motion = "pan_down"
        else:
            effective_motion = "zoom_in" if (idx % 2 == 0) else "zoom_out"
    elif norm_motion in ("zoom_in", "slow_zoom_in", "zoomin"):
        effective_motion = "zoom_in"
    elif norm_motion in ("zoom_out", "slow_zoom_out", "zoomout"):
        effective_motion = "zoom_out"
    elif norm_motion in ("pan_down", "pandown"):
        effective_motion = "pan_down"
    elif norm_motion in ("pan_up", "panup"):
        effective_motion = "pan_up"
    elif norm_motion in ("pan_right", "panright"):
        effective_motion = "pan_right"
    elif norm_motion in ("pan_left", "panleft"):
        effective_motion = "pan_left"
    elif norm_motion in ("shake", "camera_shake", "camerashake"):
        effective_motion = "camera_shake"
    elif norm_motion in ("static", "none", "static_view", "staticview"):
        effective_motion = "static"
    else:
        effective_motion = "zoom_in" if (idx % 2 == 0) else "zoom_out"

    # CASE 1: Vertical Manhwa pan_down / pan_up (aspect_ratio >= 1.25)
    if effective_motion in ("pan_down", "pan_up") and aspect_ratio >= 1.25:
        scale = target_width / img_w
        scaled_w = target_width
        scaled_h = max(target_height, int(img_h * scale))
        scaled_img = img.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
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
            if sub_overlay:
                rgb, alpha = sub_overlay
                h_b = rgb.shape[0]
                frame[-h_b:, 0:target_width] = (
                    frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
                ).astype(np.uint8)
            return frame

        return VideoClip(make_frame_scroll, duration=duration), effective_motion

    # CASE 2: Pan Down / Up for standard aspect ratio
    elif effective_motion in ("pan_down", "pan_up"):
        composite_frame = build_panel_frame_image(img, img, target_width, target_height)
        oversize_h = int(target_height * 1.12)
        oversized = composite_frame.resize((target_width, oversize_h), Image.Resampling.LANCZOS)
        arr = np.array(oversized, dtype=np.uint8)
        max_dy = oversize_h - target_height

        def make_frame_v_pan(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "pan_up":
                ease = 1.0 - ease
            y0 = int(ease * max_dy)
            frame = arr[y0:y0 + target_height, 0:target_width].copy()
            if sub_overlay:
                rgb, alpha = sub_overlay
                h_b = rgb.shape[0]
                frame[-h_b:, 0:target_width] = (
                    frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
                ).astype(np.uint8)
            return frame

        return VideoClip(make_frame_v_pan, duration=duration), effective_motion

    # CASE 3: Pan Right / Left
    elif effective_motion in ("pan_right", "pan_left"):
        composite_frame = build_panel_frame_image(img, img, target_width, target_height)
        oversize_w = int(target_width * 1.12)
        oversized = composite_frame.resize((oversize_w, target_height), Image.Resampling.LANCZOS)
        arr = np.array(oversized, dtype=np.uint8)
        max_dx = oversize_w - target_width

        def make_frame_h_pan(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "pan_left":
                ease = 1.0 - ease
            x0 = int(ease * max_dx)
            frame = arr[0:target_height, x0:x0 + target_width].copy()
            if sub_overlay:
                rgb, alpha = sub_overlay
                h_b = rgb.shape[0]
                frame[-h_b:, 0:target_width] = (
                    frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
                ).astype(np.uint8)
            return frame

        return VideoClip(make_frame_h_pan, duration=duration), effective_motion

    # CASE 4: True Optical Zoom In / Zoom Out
    elif effective_motion in ("zoom_in", "zoom_out"):
        composite_frame = build_panel_frame_image(img, img, target_width, target_height)
        base_arr = np.array(composite_frame, dtype=np.uint8)

        def make_frame_zoom(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            ease = 0.5 - 0.5 * np.cos(p * np.pi)
            if effective_motion == "zoom_in":
                scale = 1.0 + 0.12 * ease
            else:
                scale = 1.12 - 0.12 * ease

            crop_w = max(1, int(target_width / scale))
            crop_h = max(1, int(target_height / scale))
            crop_x = max(0, (target_width - crop_w) // 2)
            crop_y = max(0, (target_height - crop_h) // 2)

            sub_region = base_arr[crop_y:crop_y + crop_h, crop_x:crop_x + crop_w]
            if cv2 is not None:
                frame = cv2.resize(sub_region, (target_width, target_height), interpolation=cv2.INTER_LINEAR)
            else:
                frame = np.array(
                    Image.fromarray(sub_region).resize((target_width, target_height), Image.Resampling.BILINEAR)
                )

            if sub_overlay:
                rgb, alpha = sub_overlay
                h_b = rgb.shape[0]
                frame[-h_b:, 0:target_width] = (
                    frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
                ).astype(np.uint8)
            return frame

        return VideoClip(make_frame_zoom, duration=duration), effective_motion

    # CASE 5: Camera Shake (impact oscillation)
    elif effective_motion == "camera_shake":
        composite_frame = build_panel_frame_image(img, img, target_width, target_height)
        oversize_w = int(target_width * 1.06)
        oversize_h = int(target_height * 1.06)
        oversized = composite_frame.resize((oversize_w, oversize_h), Image.Resampling.LANCZOS)
        arr = np.array(oversized, dtype=np.uint8)
        base_x = (oversize_w - target_width) // 2
        base_y = (oversize_h - target_height) // 2

        def make_frame_shake(t):
            p = min(1.0, max(0.0, t / duration)) if duration > 0 else 0.0
            decay = max(0.3, 1.0 - p * 0.4)
            dx = int((6.0 * np.sin(p * 26.0 * np.pi) + 3.0 * np.sin(p * 47.0 * np.pi)) * decay)
            dy = int((5.0 * np.cos(p * 30.0 * np.pi) + 2.0 * np.cos(p * 53.0 * np.pi)) * decay)
            x0 = max(0, min(oversize_w - target_width, base_x + dx))
            y0 = max(0, min(oversize_h - target_height, base_y + dy))
            frame = arr[y0:y0 + target_height, x0:x0 + target_width].copy()
            if sub_overlay:
                rgb, alpha = sub_overlay
                h_b = rgb.shape[0]
                frame[-h_b:, 0:target_width] = (
                    frame[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
                ).astype(np.uint8)
            return frame

        return VideoClip(make_frame_shake, duration=duration), effective_motion

    # CASE 6: Static / Clean view
    else:
        composite_frame = build_panel_frame_image(img, img, target_width, target_height)
        arr = np.array(composite_frame, dtype=np.uint8)
        if sub_overlay:
            rgb, alpha = sub_overlay
            h_b = rgb.shape[0]
            arr[-h_b:, 0:target_width] = (
                arr[-h_b:, 0:target_width] * (1.0 - alpha) + rgb * alpha
            ).astype(np.uint8)

        return ImageClip(arr).set_duration(duration), "static"


__all__ = ["build_cinematic_motion_clip"]
