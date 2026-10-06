"""
backend/common/image/dimensions.py
─────────────────────────────────────────────────────────────────────────────
Image aspect ratio, coordinate geometry, and scaling dimensions utilities.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Tuple, Optional


STANDARD_RATIOS = {
    (16, 9): "16:9",
    (9, 16): "9:16",
    (1, 1): "1:1",
    (4, 3): "4:3",
    (3, 4): "3:4",
    (21, 9): "21:9",
    (2, 3): "2:3",
}


def calculate_aspect_ratio(width: int, height: int) -> float:
    """Returns floating-point aspect ratio width / height (defaults to 1.0 if invalid)."""
    if not width or not height or height <= 0:
        return 1.0
    return round(width / height, 4)


def get_standard_aspect_ratio_name(width: int, height: int, tolerance: float = 0.05) -> str:
    """
    Finds the closest canonical aspect ratio string label (e.g. '16:9', '9:16', '1:1').
    """
    if not width or not height or height <= 0:
        return "1:1"
    ratio = width / height
    for (rw, rh), label in STANDARD_RATIOS.items():
        expected = rw / rh
        if abs(ratio - expected) <= tolerance:
            return label
    return f"{width}:{height}"


def fit_dimensions_within_bounds(
    width: int,
    height: int,
    max_width: int,
    max_height: int,
) -> Tuple[int, int]:
    """
    Computes dimensions preserving aspect ratio fitted inside max_width x max_height.
    """
    if width <= 0 or height <= 0:
        return max_width, max_height

    aspect = width / height
    target_width = min(width, max_width)
    target_height = int(target_width / aspect)

    if target_height > max_height:
        target_height = max_height
        target_width = int(target_height * aspect)

    # Ensure even dimensions (required by many video/image encoders)
    target_width = target_width - (target_width % 2)
    target_height = target_height - (target_height % 2)

    return max(2, target_width), max(2, target_height)


__all__ = [
    "STANDARD_RATIOS",
    "calculate_aspect_ratio",
    "get_standard_aspect_ratio_name",
    "fit_dimensions_within_bounds",
]
