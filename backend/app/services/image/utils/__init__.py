"""Utilities for services.image
Re-export commonly used helpers for backward compatibility.
"""
from .image_utils import resolve_image_to_buffer, resolve_url_to_buffer
from .panel_image_utils import trim_solid_borders, _filter_solid_noise
from .panel_box_utils import adjust_to_aspect_ratio, merge_overlapping_boxes, protect_slice_x, protect_slice_y

__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    "trim_solid_borders",
    "_filter_solid_noise",
    "adjust_to_aspect_ratio",
    "merge_overlapping_boxes",
    "protect_slice_x",
    "protect_slice_y",
]
