""" 
backend/app/services/image/image_utils.py
─────────────────────────────────────────────────────────────────────────────
Facade exports for image utilities.

Some parts of the backend import helpers like:

    from services.image.image_utils import resolve_image_to_buffer

This module re-exports the concrete implementations from the underlying
submodules so imports remain stable.
─────────────────────────────────────────────────────────────────────────────
"""

from .image_resolver import resolve_image_to_buffer, resolve_url_to_buffer

# Other image utilities are expected to be imported directly from their
# specific modules (image_ops, image_stitcher, etc.)

__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
]

