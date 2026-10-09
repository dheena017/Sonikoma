"""
backend/common/image/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Image Domain Primitives:
- dimensions: Aspect ratio calculations, bounds fitting, standard ratio names
- processing: Metadata inspection, brightness, format conversion, placeholders
─────────────────────────────────────────────────────────────────────────────
"""

from .dimensions import (
    STANDARD_RATIOS,
    calculate_aspect_ratio,
    get_standard_aspect_ratio_name,
    fit_dimensions_within_bounds,
)
from .processing import (
    get_image_metadata,
    compute_image_brightness,
    convert_image_format,
    create_placeholder_image,
    create_svg_placeholder,
    generate_manhwa_panel_artwork,
    trim_image_borders,
    crop_auto_borders,
)

__all__ = [
    # Dimensions & Geometry
    "STANDARD_RATIOS",
    "calculate_aspect_ratio",
    "get_standard_aspect_ratio_name",
    "fit_dimensions_within_bounds",
    # Processing & Inspection
    "get_image_metadata",
    "compute_image_brightness",
    "convert_image_format",
    "create_placeholder_image",
    "create_svg_placeholder",
    "generate_manhwa_panel_artwork",
    "trim_image_borders",
    "crop_auto_borders",
]
