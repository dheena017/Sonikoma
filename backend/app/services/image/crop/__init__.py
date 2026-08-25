"""
backend/app/services/image/crop/__init__.py
─────────────────────────────────────────────────────────────────────────────
Crop Services Module:
- detect_image_layout_type: 5-layer layout classifier
- crop_long_panels_batch: High-speed parallel Webtoon batch slicer
- crop_single_panels_margins: 4-directional margin cropper with aspect snapping
─────────────────────────────────────────────────────────────────────────────
"""

from .detect_type_service import detect_image_layout_type
from .long_panels_crop_service import crop_long_panels_batch
from .single_panels_crop_service import crop_single_panels_margins

__all__ = [
    "detect_image_layout_type",
    "crop_long_panels_batch",
    "crop_single_panels_margins",
]
