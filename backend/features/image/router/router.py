"""
backend/features/image/router/router.py
─────────────────────────────────────────────────────────────────────────────
Master Image Router coordinating all crop, edit, detect, transform,
metadata, and upload sub-routers.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from .crop import router as crop_router
from .edit import router as edit_router
from .detect import router as detect_router
from .transform import router as transform_router
from .upload import router as upload_router
from .metadata import router as metadata_router
from .layers import router as layers_router

image_router = APIRouter()

image_router.include_router(crop_router, prefix="/crop", tags=["08. Image Cropping & Slicing"])
image_router.include_router(edit_router)
image_router.include_router(detect_router)
image_router.include_router(transform_router)
image_router.include_router(upload_router)
image_router.include_router(metadata_router)
image_router.include_router(layers_router)

router = image_router

__all__ = [
    "image_router",
    "router",
]
