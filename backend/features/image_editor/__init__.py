"""
backend/features/image_editor/__init__.py
─────────────────────────────────────────────────────────────────────────────
Image Editor Feature Domain:
Exposes canonical sub-domain routers, services, and shared schemas for:
- panels: Frame detection, layout analysis, vertical strip splitting
- images: Image cropping, transformations, filters, uploads, and metadata
- ocr: Speech bubble dialogue detection and OCR transcription
─────────────────────────────────────────────────────────────────────────────
"""

from .router import panels_router, image_router, ocr_router
from . import schemas
from . import services

__all__ = [
    "panels_router",
    "image_router",
    "ocr_router",
    "schemas",
    "services",
]
