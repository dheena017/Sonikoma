"""
backend/app/api/v1/images/metadata.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for extracting image metadata and performing OCR dialogue extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.image_editor.schemas import MetadataRequest
import features.image_editor.services.utils.image_utils as img_utils

logger = logging.getLogger("sonikoma.api.images.metadata")
router = APIRouter()


@router.post("/metadata", summary="Extract general metadata and specs from image URL")
async def get_image_metadata(body: MetadataRequest):
    try:
        image_bytes = await img_utils.download_image_to_memory(body.url)
        meta = img_utils.get_image_meta(image_bytes)
        fingerprint = img_utils.fingerprint_image(image_bytes)
        return {
            "success": True,
            "width": meta.width,
            "height": meta.height,
            "format": meta.format,
            "aspectRatio": meta.aspectRatio,
            "megapixels": meta.megapixels,
            "orientation": meta.orientation,
            "sizeBytes": meta.sizeBytes,
            "fingerprint": fingerprint
        }
    except Exception as e:
        logger.error(f"[Metadata API] Failed to extract metadata: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
