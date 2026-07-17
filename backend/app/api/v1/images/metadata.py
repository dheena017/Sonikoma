"""
backend/app/api/v1/images/metadata.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for extracting image metadata and performing OCR dialogue extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from media.image.ocr import extract_dialogue_from_panel, extract_full_ocr_data
from schemas.image import MetadataRequest, OCRBase64Request
import services.image.image_utils as img_utils

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


@router.post("/extract", summary="Extract speech dialogue transcriptions sequentially from panel URL")
async def extract_text(body: MetadataRequest):
    try:
        dialogue = await extract_dialogue_from_panel(body.url)
        return {"success": True, "dialogue": dialogue}
    except Exception as e:
        logger.error(f"[OCR API] Error extracting dialogue text: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-full", summary="Extract full bounding-box dialogue map sequentially from panel URL")
async def extract_full_text(body: MetadataRequest):
    try:
        full_data = await extract_full_ocr_data(body.url)
        return {"success": True, "ocr_data": full_data}
    except Exception as e:
        logger.error(f"[OCR Full API] Error extracting full boundary map: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-b64", include_in_schema=False)
async def extract_text_b64(body: OCRBase64Request):
    return {"success": False, "error": "B64 endpoints deprecated. Please upload file and use URL."}


@router.post("/extract-full-b64", include_in_schema=False)
async def extract_full_text_b64(body: OCRBase64Request):
    return {"success": False, "error": "B64 endpoints deprecated. Please upload file and use URL."}
