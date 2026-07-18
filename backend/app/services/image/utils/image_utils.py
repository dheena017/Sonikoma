"""
compatibility copy of image_utils into utils/ for clearer structure
"""

from ..image_resolver import resolve_image_to_buffer, resolve_url_to_buffer

__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
]
