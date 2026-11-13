"""
backend/features/image/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified Image Router Package:
- image_router: Main FastAPI router mounting all image operations
─────────────────────────────────────────────────────────────────────────────
"""

from .router import image_router, router
from .layers import router as layers_router
from .panels import router as panels_router
from .ocr import router as ocr_router

__all__ = [
    "image_router",
    "router",
    "layers_router",
    "panels_router",
    "ocr_router",
]
