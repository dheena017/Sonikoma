"""
backend/features/image_editor/services/crop/single_panels_crop_service.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility facade for single_panels_crop_service.
Canonical implementation located at features.image.crop.margin_crop_service.
─────────────────────────────────────────────────────────────────────────────
"""

from PIL import Image
from features.image.utils.autotrim import autotrim_solid_borders
from features.image.crop.margin_crop_service import crop_panel_margins


def _apply_color_distance_autotrim(img: Image.Image, tolerance: int = 15, safety_padding: int = 4):
    """Legacy wrapper returning (trimmed_img, was_trimmed)."""
    trimmed, _, was_trimmed = autotrim_solid_borders(img, tolerance=tolerance, safety_padding=safety_padding)
    return trimmed, was_trimmed


crop_single_panels_margins = crop_panel_margins
crop_small_panels_margins = crop_panel_margins

__all__ = [
    "_apply_color_distance_autotrim",
    "crop_single_panels_margins",
    "crop_small_panels_margins",
    "crop_panel_margins",
]
