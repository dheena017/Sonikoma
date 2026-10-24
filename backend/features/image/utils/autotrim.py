"""
backend/features/image/utils/autotrim.py
─────────────────────────────────────────────────────────────────────────────
Foundational Euclidean Color-Distance Auto-Trim Border Scanner:
- Detects and trims uniform background scanner borders (white, black, or scanner noise)
- Samples 4-corner pixel clusters to calculate baseline background color
- Preserves intentional bleeds, panel artwork strokes, and outer borders
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Tuple, Dict, Any, Optional
import numpy as np
from PIL import Image

from common.image import crop_auto_borders as common_crop_auto_borders


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helper Functions (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _sample_corner_background_color(rgb_array: np.ndarray) -> np.ndarray:
    """Samples mean RGB values from outer corner patches."""
    h, w, _ = rgb_array.shape
    corner_size = max(1, min(4, min(h, w) // 20))
    top_left = rgb_array[:corner_size, :corner_size]
    top_right = rgb_array[:corner_size, -corner_size:]
    bot_left = rgb_array[-corner_size:, :corner_size]
    bot_right = rgb_array[-corner_size:, -corner_size:]

    corners = np.concatenate([
        top_left.reshape(-1, 3),
        top_right.reshape(-1, 3),
        bot_left.reshape(-1, 3),
        bot_right.reshape(-1, 3),
    ], axis=0)

    return np.mean(corners, axis=0)


def _compute_content_mask(rgb_array: np.ndarray, bg_color: np.ndarray, tolerance: int) -> np.ndarray:
    """Computes boolean mask where pixels deviate from background color beyond tolerance."""
    diff = np.linalg.norm(rgb_array.astype(float) - bg_color.astype(float), axis=2)
    return diff > tolerance


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Functions (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def autotrim_solid_borders(
    img: Image.Image,
    tolerance: int = 18,
    safety_padding: int = 8
) -> Tuple[Image.Image, Tuple[int, int, int, int], bool]:
    """
    Trims solid/scanned borders (e.g. white/black/neutral margins) from an image.
    Uses independent 4-edge gutter variance detection and Euclidean color distance
    from outer gutter strips to eliminate extra whitespace around panels without
    clipping bleed panels, character artwork, or speech bubble strokes.
    """
    w, h = img.size
    if h < 25 or w < 25:
        return img, (0, 0, w, h), False

    try:
        rgb = np.array(img.convert("RGB"))

        # Test outer edge border strips (thickness 1-4px depending on dimensions)
        band_y = min(4, max(1, h // 100))
        band_x = min(4, max(1, w // 100))

        top_strip = rgb[:band_y, :, :]
        bot_strip = rgb[-band_y:, :, :]
        left_strip = rgb[:, :band_x, :]
        right_strip = rgb[:, -band_x:, :]

        top_std = float(np.std(top_strip))
        bot_std = float(np.std(bot_strip))
        left_std = float(np.std(left_strip))
        right_std = float(np.std(right_strip))

        # Check for ink stroke transitions in outer strips
        top_strokes = int(np.sum(np.abs(np.diff(top_strip.astype(float), axis=1)) > 15.0))
        bot_strokes = int(np.sum(np.abs(np.diff(bot_strip.astype(float), axis=1)) > 15.0))
        left_strokes = int(np.sum(np.abs(np.diff(left_strip.astype(float), axis=0)) > 15.0))
        right_strokes = int(np.sum(np.abs(np.diff(right_strip.astype(float), axis=0)) > 15.0))

        # Stricter threshold for considering an edge strip a uniform background gutter:
        # A true gutter strip has low standard deviation AND virtually zero ink strokes.
        max_edge_std = 12.0
        max_edge_strokes_x = max(1, int(w * 0.01))
        max_edge_strokes_y = max(1, int(h * 0.01))

        top_is_gutter = (top_std < max_edge_std) and (top_strokes <= max_edge_strokes_x)
        bot_is_gutter = (bot_std < max_edge_std) and (bot_strokes <= max_edge_strokes_x)
        left_is_gutter = (left_std < max_edge_std) and (left_strokes <= max_edge_strokes_y)
        right_is_gutter = (right_std < max_edge_std) and (right_strokes <= max_edge_strokes_y)

        # If none of the edges are uniform gutters, no trimming needed
        if not (top_is_gutter or bot_is_gutter or left_is_gutter or right_is_gutter):
            return img, (0, 0, w, h), False

        # Build reference background color from the uniform gutter strips
        gutter_samples = []
        if top_is_gutter:
            gutter_samples.append(top_strip.reshape(-1, 3))
        if bot_is_gutter:
            gutter_samples.append(bot_strip.reshape(-1, 3))
        if left_is_gutter:
            gutter_samples.append(left_strip.reshape(-1, 3))
        if right_is_gutter:
            gutter_samples.append(right_strip.reshape(-1, 3))

        bg_rgb = np.median(np.concatenate(gutter_samples, axis=0), axis=0)

        # Compute Euclidean distance of every pixel to background color
        diff = np.linalg.norm(rgb - bg_rgb, axis=2)
        is_content = diff > tolerance

        if not np.any(is_content):
            return img, (0, 0, w, h), False

        rows = np.any(is_content, axis=1)
        cols = np.any(is_content, axis=0)

        ymin_all, ymax_all = np.where(rows)[0][[0, -1]]
        xmin_all, xmax_all = np.where(cols)[0][[0, -1]]

        # Adaptive safety padding: never shave tightly against character hair or bubbles
        safe_pad = max(safety_padding, max(8, int(min(w, h) * 0.015)))

        # Maximum trim guard: never shave off more than 12% of dimension on any single edge
        # to avoid eating into intentional whitespace around characters or scenes
        max_trim_y = max(8, int(h * 0.12))
        max_trim_x = max(8, int(w * 0.12))

        t_y1 = min(max_trim_y, max(0, int(ymin_all) - safe_pad)) if top_is_gutter else 0
        t_y2 = max(h - max_trim_y, min(h, int(ymax_all) + 1 + safe_pad)) if bot_is_gutter else h
        t_x1 = min(max_trim_x, max(0, int(xmin_all) - safe_pad)) if left_is_gutter else 0
        t_x2 = max(w - max_trim_x, min(w, int(xmax_all) + 1 + safe_pad)) if right_is_gutter else w

        # Ensure reasonable bounds
        if (t_x2 - t_x1 >= 25) and (t_y2 - t_y1 >= 25):
            # Only trim if there are actually extra borders (> 1px on any side)
            if t_x1 > 0 or t_y1 > 0 or t_x2 < w or t_y2 < h:
                trimmed = img.crop((t_x1, t_y1, t_x2, t_y2))
                return trimmed, (t_x1, t_y1, t_x2, t_y2), True

        return img, (0, 0, w, h), False

    except Exception:
        return img, (0, 0, w, h), False


def crop_auto_borders(
    img_data: bytes,
    tighter: bool = False,
    crop_padding: Optional[int] = None
) -> Dict[str, Any]:
    """
    Delegates to common.image.crop_auto_borders for byte-level buffer cropping.
    Maintains compatibility with legacy callers.
    """
    return common_crop_auto_borders(img_data, tighter=tighter, crop_padding=crop_padding)


_apply_color_distance_autotrim = autotrim_solid_borders

__all__ = [
    "autotrim_solid_borders",
    "crop_auto_borders",
    "_apply_color_distance_autotrim",
]
