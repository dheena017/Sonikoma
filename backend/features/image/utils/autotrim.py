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
    tolerance: int = 15,
    safety_padding: int = 4
) -> Tuple[Image.Image, Tuple[int, int, int, int], bool]:
    """
    Scans an image using Euclidean color distance from corner pixels to detect and
    trim solid background borders or scanner noise margins.

    Args:
        img: Input PIL Image.
        tolerance: Euclidean distance threshold (default 15).
        safety_padding: Pixel padding to preserve inside detected content bounds.

    Returns:
        Tuple of (trimmed_image, (left, top, right, bottom), was_trimmed_bool).
    """
    w, h = img.size
    if h < 25 or w < 25:
        return img, (0, 0, w, h), False

    try:
        rgb_array = np.array(img.convert("RGB"))
        bg_color = _sample_corner_background_color(rgb_array)
        is_content = _compute_content_mask(rgb_array, bg_color, tolerance)

        if not np.any(is_content):
            return img, (0, 0, w, h), False

        rows = np.any(is_content, axis=1)
        cols = np.any(is_content, axis=0)

        ymin, ymax = np.where(rows)[0][[0, -1]]
        xmin, xmax = np.where(cols)[0][[0, -1]]

        # Expand slightly by safety padding
        ymin = max(0, int(ymin) - safety_padding)
        ymax = min(h, int(ymax) + 1 + safety_padding)
        xmin = max(0, int(xmin) - safety_padding)
        xmax = min(w, int(xmax) + 1 + safety_padding)

        # Guard against zero-area crops or micro cuts
        if (xmax - xmin) < 20 or (ymax - ymin) < 20:
            return img, (0, 0, w, h), False

        # Only apply crop if meaningful margin was actually eliminated (>= 4px)
        if (xmin > 3 or ymin > 3 or (w - xmax) > 3 or (h - ymax) > 3):
            cropped = img.crop((xmin, ymin, xmax, ymax))
            return cropped, (xmin, ymin, xmax, ymax), True

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


__all__ = [
    "autotrim_solid_borders",
    "crop_auto_borders",
]
