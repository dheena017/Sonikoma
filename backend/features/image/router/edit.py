"""
backend/features/image/router/edit.py
─────────────────────────────────────────────────────────────────────────────
Image Editing & State Restoration Router:
- Composes rotation, flipping, margin cropping, autotrim, and format conversion
- Maintains session edit undo stack in edit_history cache
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import asyncio
import logging
from fastapi import APIRouter, HTTPException

from app.core.cache import stitched_cache, edit_history
from database.supabase import upload_to_supabase_bucket
from features.image.schemas import EditImageRequest, UndoEditRequest
from features.image.utils.media_utils import download_image_to_memory, get_image_metadata
from features.image.crop.margin_crop_service import crop_panel_margins
from features.image.transform.rotate_service import rotate_image
from features.image.transform.flip_service import flip_image
from features.image.transform.format_converter_service import convert_image_format

logger = logging.getLogger("sonikoma.features.image.router.edit")
router = APIRouter()


@router.post("/edit", summary="Edit, rotate, flip, and auto-trim an image panel")
async def apply_image_edits(body: EditImageRequest):
    """Executes composite editing steps (rotate, flip, crop, autotrim, convert) on an image."""
    try:
        buffer = await download_image_to_memory(body.url)
        if not buffer:
            raise HTTPException(status_code=400, detail="Could not download source image buffer.")

        # 1. Rotate
        if body.rotate and body.rotate != 0:
            buffer = rotate_image(buffer, angle=body.rotate)

        # 2. Flip
        if body.flipHorizontal:
            buffer = flip_image(buffer, horizontal=True)

        # 3. Margin Crop, AutoTrim, & Aspect Ratio Snap
        buffer, meta = crop_panel_margins(
            image_bytes=buffer,
            crop_top=body.cropTop or 0.0,
            crop_bottom=body.cropBottom or 0.0,
            crop_left=body.cropLeft or 0.0,
            crop_right=body.cropRight or 0.0,
            unit="percent",
            auto_trim=bool(body.autoTrim),
            aspect_ratio=body.aspectRatio or "free",
            output_format="PNG"
        )

        # 4. Format Conversion & Quality
        out_fmt = (body.outputFormat or "jpeg").lower()
        quality = body.cropQuality or 90
        buffer = convert_image_format(buffer, target_format=out_fmt, quality=quality)

        # 5. Persist to storage or cache
        ext = "jpg" if out_fmt in ("jpeg", "jpg") else out_fmt
        filename = f"edit_{uuid.uuid4().hex[:8]}.{ext}"
        content_type = f"image/{out_fmt}"

        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            buffer,
            "panels",
            filename,
            content_type
        )

        final_url = supabase_url or f"/api/v1/images/cached/{filename}"
        if not supabase_url:
            stitched_cache.set(filename, {"data": buffer, "content_type": content_type})

        # Register previous state for undo capability
        edit_history.set(final_url, body.url)

        final_meta = get_image_metadata(buffer)

        return {
            "success": True,
            "url": final_url,
            "previous_url": body.url,
            "width": final_meta.width,
            "height": final_meta.height,
            "aspectRatio": final_meta.aspectRatio,
            "autoTrimmed": meta.get("auto_trimmed", False),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Edit API] Error editing image frame: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/undo-edit", summary="Restore previous edit state of an edited image")
async def undo_image_edit(body: UndoEditRequest):
    """Retrieves previous image URL prior to last edit operation from session cache."""
    prev = edit_history.get(body.url)
    if not prev:
        raise HTTPException(status_code=404, detail="No previous edit state found in session history.")
    return {"success": True, "previous_url": prev}


@router.post("/crop", include_in_schema=False, summary="Alias for image edits")
async def apply_image_crop(body: EditImageRequest):
    return await apply_image_edits(body)


@router.post("/undo-crop", include_in_schema=False, summary="Alias for undo image edit")
async def undo_image_crop(body: UndoEditRequest):
    return await undo_image_edit(body)


__all__ = ["router"]
