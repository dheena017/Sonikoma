"""
backend/app/api/v1/images/router.py
─────────────────────────────────────────────────────────────────────────────
Main entry router coordinating all image editing, detection, and transformation sub-routers.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

# Import sub-routers
from features.image_editor.router.crop import router as crop_router
from features.image_editor.router.edit import router as edit_router
from features.image_editor.router.detect import router as detect_router
from features.image_editor.router.upload import router as upload_router
from features.image_editor.router.metadata import router as metadata_router
from features.image_editor.router.transform import router as transform_router

image_router = APIRouter()

# Include sub-routers under main image_router
image_router.include_router(crop_router, prefix="/crop", tags=["08. Image Cropping & Slicing"])
image_router.include_router(edit_router)
image_router.include_router(detect_router)
image_router.include_router(upload_router)
image_router.include_router(metadata_router)
image_router.include_router(transform_router)

# Legacy routers expected by api/router.py imports
cleaner_router = APIRouter()
imagemagick_router = APIRouter()
ocr_router = APIRouter()

router = image_router

__all__ = [
    "image_router",
    "router",
    "cleaner_router",
    "imagemagick_router",
    "ocr_router",
]
