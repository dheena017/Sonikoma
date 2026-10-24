"""
backend/features/image/router/metadata.py
─────────────────────────────────────────────────────────────────────────────
Image Metadata Router:
- Extracts dimensions, format, channels, aspect ratio, orientation, and megapixels
- Computes cryptographic MD5 fingerprints for asset deduplication and cache keys
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.image.schemas import MetadataRequest
from features.image.utils.media_utils import (
    get_image_metadata,
    fingerprint_image,
    download_image_to_memory,
)

logger = logging.getLogger("sonikoma.features.image.router.metadata")
router = APIRouter()


@router.post("/metadata", summary="Extract rich metadata and fingerprint from image URL")
async def extract_image_metadata_endpoint(body: MetadataRequest):
    """Downloads image to memory and calculates dimensions, channels, aspect ratio, and fingerprint."""
    try:
        image_bytes = await download_image_to_memory(body.url)
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Could not retrieve image data from URL.")

        meta = get_image_metadata(image_bytes)
        fp = fingerprint_image(image_bytes)

        return {
            "success": True,
            "width": meta.width,
            "height": meta.height,
            "format": meta.format,
            "aspectRatio": meta.aspectRatio,
            "megapixels": meta.megapixels,
            "orientation": meta.orientation,
            "sizeBytes": meta.sizeBytes,
            "fingerprint": fp,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Metadata API] Failed to extract metadata: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
