"""
backend/app/api/v1/images/router.py
─────────────────────────────────────────────────────────────────────────────
Main entry router coordinating all image editing, detection, and transformation sub-routers.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

# Import sub-routers
from api.v1.images.edit import router as edit_router
from api.v1.images.detect import router as detect_router
from api.v1.images.upload import router as upload_router
from api.v1.images.metadata import router as metadata_router
from api.v1.images.transform import router as transform_router

image_router = APIRouter()

# Include sub-routers under main image_router
image_router.include_router(edit_router)
image_router.include_router(detect_router)
image_router.include_router(upload_router)
image_router.include_router(metadata_router)
image_router.include_router(transform_router)

# Legacy routers expected by api/router.py imports
cleaner_router = APIRouter()
imagemagick_router = APIRouter()
ocr_router = APIRouter()
