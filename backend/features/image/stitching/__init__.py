"""
backend/features/image/stitching/__init__.py
─────────────────────────────────────────────────────────────────────────────
Canonical Stitching & Panel Merging Services:
- merge_image_panels: Async URL-resolving high-level multi-panel stitcher
- stitch_images_together: Direct byte-buffer multi-panel stitcher
- stack_vertical: Legacy vertical stacker with auto-width matching
─────────────────────────────────────────────────────────────────────────────
"""

from .image_stitcher import (
    stitch_images_together,
    stack_vertical,
    decode_image_buffer,
    normalize_image_dimensions,
    render_stitched_canvas,
    enforce_canvas_safety_limits,
)
from .merge_service import merge_image_panels

__all__ = [
    "merge_image_panels",
    "stitch_images_together",
    "stack_vertical",
    "decode_image_buffer",
    "normalize_image_dimensions",
    "render_stitched_canvas",
    "enforce_canvas_safety_limits",
]
