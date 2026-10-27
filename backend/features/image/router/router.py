"""
backend/features/image/router/router.py
─────────────────────────────────────────────────────────────────────────────
Master Image Router coordinating all crop, edit, detect, transform,
metadata, and upload sub-routers.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Request, Response, HTTPException

from .crop import router as crop_router
from .edit import router as edit_router
from .detect import router as detect_router
from .transform import router as transform_router
from .upload import router as upload_router
from .metadata import router as metadata_router
from .layers import router as layers_router
from features.image.stitching.stitch_cache_service import (
    retrieve_cached_stitch_service,
    StitchedResourceNotFound,
)

logger = logging.getLogger("sonikoma.features.image.router")

image_router = APIRouter()

image_router.include_router(crop_router, prefix="/crop", tags=["08. Image Cropping & Slicing"])
image_router.include_router(edit_router)
image_router.include_router(detect_router)
image_router.include_router(transform_router)
image_router.include_router(upload_router)
image_router.include_router(metadata_router)
image_router.include_router(layers_router)


@image_router.get("/cached/{cache_id:path}", summary="Retrieve cached or dynamically recovered stitched image")
async def get_cached_image_endpoint(cache_id: str, request: Request):
    """
    Retrieves a cached transformed/stitched panel or triggers dynamic on-demand recovery.
    """
    clean_id = cache_id.strip()
    try:
        referer = request.headers.get("referer")
        data, content_type = await retrieve_cached_stitch_service(clean_id, referer=referer)
        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400, immutable",
                "X-Cache-Lookup": "HIT",
            },
        )
    except StitchedResourceNotFound:
        raise HTTPException(
            status_code=404,
            detail=f"Cached image '{clean_id}' not found or expired.",
        )
    except Exception as exc:
        logger.error(f"[Cached Image API] Failed retrieving '{clean_id}': {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


router = image_router

__all__ = [
    "image_router",
    "router",
]
