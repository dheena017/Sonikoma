"""
backend/features/image/utils/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified Foundational Utilities Package for Image Processing:
- autotrim: Euclidean color-distance margin auto-trim
- box_utils: PanelBounds, coordinate math, IOU, aspect ratio clamping
- media_utils: Buffer resolution, brightness, metadata, fingerprinting, cache
─────────────────────────────────────────────────────────────────────────────
"""

from .autotrim import (
    autotrim_solid_borders,
    crop_auto_borders,
)

from .box_utils import (
    PanelBounds,
    adjust_to_aspect_ratio,
    clamp_box,
    calculate_iou,
)

from .media_utils import (
    ImageMeta,
    get_image_metadata,
    fingerprint_image,
    compute_brightness,
    save_image_to_cache,
    download_image_to_memory,
    resolve_image_to_buffer,
    resolve_url_to_buffer,
)

from features.image.stitching.image_stitcher import (
    stitch_images_together,
    stack_vertical,
)

__all__ = [
    # Autotrim
    "autotrim_solid_borders",
    "crop_auto_borders",
    # Box Math
    "PanelBounds",
    "adjust_to_aspect_ratio",
    "clamp_box",
    "calculate_iou",
    # Media & Buffer
    "ImageMeta",
    "get_image_metadata",
    "fingerprint_image",
    "compute_brightness",
    "save_image_to_cache",
    "download_image_to_memory",
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    # Stitching
    "stitch_images_together",
    "stack_vertical",
]
