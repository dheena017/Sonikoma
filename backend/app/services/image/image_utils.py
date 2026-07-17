"""
backend/app/services/image/image_utils.py
─────────────────────────────────────────────────────────────────────────────
Lightweight facade coordinator for image utilities. Exposes and re-exports all
resolution, operations, stitching, and analysis sub-service functions.
─────────────────────────────────────────────────────────────────────────────
"""

# Re-export from image_resolver
from services.image.image_resolver import (
    spoof_referer,
    resolve_url_to_buffer,
    resolve_image_to_buffer
)

# Re-export from image_ops
from services.image.image_ops import (
    ImageMeta,
    get_image_meta,
    fingerprint_image,
    convert_format,
    resize_fit,
    make_thumbnail,
    crop_auto_borders,
    sample_background_color,
    compute_brightness,
    apply_filters,
    add_watermark
)

# Re-export from image_stitcher
from services.image.image_stitcher import (
    stitch_images_together,
    stack_vertical
)
