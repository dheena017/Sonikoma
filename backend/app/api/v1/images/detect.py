"""
backend/app/api/v1/images/detect.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for bubble detection, removal, and YOLO diagnostics.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from schemas.image import (
    RemoveBubblesRequest,
    RemoveBubblesBatchRequest,
    CleanerBase64Request
)
from services.image.image_service import (
    debug_yolo_detections_service,
    bubble_cleaning_service,
    bubble_cleaning_batch_service
)

logger = logging.getLogger("sonikoma.api.images.detect")
router = APIRouter()


@router.post("/debug-yolo", summary="Generate yolo boundary preview overlays on panel")
async def debug_yolo(body: RemoveBubblesRequest):
    try:
        result = await debug_yolo_detections_service(body.url, body.confidence)
        return result
    except Exception as e:
        logger.error(f"[YOLO Debug API] Error generating YOLO debug preview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-speech-bubbles", summary="Clean speech bubbles from a panel and reconstruct underlay")
async def remove_speech_bubbles(body: RemoveBubblesRequest):
    try:
        result = await bubble_cleaning_service(body.url, body.confidence)
        return result
    except Exception as e:
        logger.error(f"[Bubble API] Error removing speech bubbles: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-speech-bubbles-batch", summary="Batch clean speech bubbles from multiple panels concurrently")
async def remove_speech_bubbles_batch(body: RemoveBubblesBatchRequest):
    try:
        result = await bubble_cleaning_batch_service(body.urls, body.confidence)
        return result
    except Exception as e:
        logger.error(f"[Bubble Batch API] Error in bubble batch clean: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-bubbles", include_in_schema=False)
async def remove_bubbles_alias(body: RemoveBubblesRequest):
    return await remove_speech_bubbles(body)


@router.post("/remove-bubbles-b64", include_in_schema=False)
async def remove_bubbles_b64(body: CleanerBase64Request):
    # Alias / backward compatibility placeholder
    return {"success": False, "error": "Endpoint deprecated in favor of URL ingestion."}
