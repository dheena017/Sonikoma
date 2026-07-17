"""
backend/app/api/v1/images/edit.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for cropping, editing, and restoring image states.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from utils.cache import edit_history
from backend.schemas.image import EditImageRequest, UndoEditRequest
from services.image.image_service import apply_image_edits_service

logger = logging.getLogger("sonikoma.api.images.edit")
router = APIRouter()


@router.post("/edit", summary="Edit, rotate, and auto-trim an image panel")
async def apply_image_edits(body: EditImageRequest):
    try:
        result = await apply_image_edits_service(
            url=body.url,
            rotate=body.rotate,
            flipHorizontal=body.flipHorizontal,
            cropTop=body.cropTop,
            cropBottom=body.cropBottom,
            cropLeft=body.cropLeft,
            cropRight=body.cropRight,
            autoTrim=body.autoTrim,
            padding=body.padding,
            sensitivity=body.sensitivity,
            backgroundColorMode=body.backgroundColorMode,
            aspectRatio=body.aspectRatio,
            outputFormat=body.outputFormat,
            cropQuality=body.cropQuality
        )
        return result
    except Exception as e:
        logger.error(f"[Edit API] Error editing image frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/undo-edit", summary="Restore previous edit state of an edited image")
async def undo_image_edit(body: UndoEditRequest):
    prev = edit_history.get(body.url)
    if not prev:
        raise HTTPException(status_code=404, detail="No previous edit state found in session history.")
    return {"success": True, "previous_url": prev}


@router.post("/crop", include_in_schema=False, summary="Backward-compatible alias for image edits")
async def apply_image_crop(body: EditImageRequest):
    return await apply_image_edits(body)


@router.post("/undo-crop", include_in_schema=False, summary="Backward-compatible alias for undo image edit")
async def undo_image_crop(body: UndoEditRequest):
    return await undo_image_edit(body)
