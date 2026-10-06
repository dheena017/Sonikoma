"""
backend/common/media/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Media Package:
Exports image and media buffer resolvers for cross-feature usage.
─────────────────────────────────────────────────────────────────────────────
"""

from .resolver import (
    resolve_image_to_buffer,
    resolve_url_to_buffer,
    spoof_referer,
    get_alternate_referer,
)

__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    "spoof_referer",
    "get_alternate_referer",
]
