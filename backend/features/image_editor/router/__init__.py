"""
backend/features/image_editor/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Image Editor Router Package:
- image_router: Image editing, cropping, transformations, inpainting, uploads
- panels_router: Panel splitting and detection
- ocr_router: Dialogue OCR extraction and speech bubble processing
─────────────────────────────────────────────────────────────────────────────
"""

from .router import image_router, router
from .panels import panels_router
from .ocr import ocr_router

__all__ = [
    "router",
    "image_router",
    "panels_router",
    "ocr_router",
]
