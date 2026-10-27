"""
backend/features/image/router/crop.py
─────────────────────────────────────────────────────────────────────────────
Image Cropping & Slicing Router:
1. POST /detect-type  -> 5-layer layout & comic format classifier
2. POST /long-panels  -> Multi-panel batch slicer (Webtoons / Strips)
3. POST /small-panels -> 4-directional margin cropper (Top, Bottom, Left, Right)
4. POST /split-gutters-> Automated row-variance gutter splitter
5. POST /manual-split -> Slices strip at user-specified percentage cut lines
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.image.schemas import (
    DetectTypeRequest,
    DetectTypeResponse,
    LongPanelsCropRequest,
    LongPanelsCropResponse,
    SmallPanelsCropRequest,
    SmallPanelsCropResponse,
)
from features.image.detector.detect_type_service import detect_image_layout_type
from features.image.crop.long_panels_crop_service import crop_long_panels_batch
from features.image.crop.margin_crop_service import crop_panel_margins
from features.image.crop.panel_splitter_service import split_strip_by_gutters
from features.image.crop.manual_split_service import cut_strip_at_positions
from features.image.utils.media_utils import download_image_to_memory

logger = logging.getLogger("sonikoma.features.image.router.crop")
router = APIRouter()


@router.post(
    "/detect-type",
    response_model=DetectTypeResponse,
    summary="Classify image layout, reading flow, and optimal cropping parameters"
)
async def detect_type_endpoint(body: DetectTypeRequest):
    """Analyzes image aspect ratio, background color palette, edge complexity, and gutter valleys."""
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_image_layout_type(url=body.url, image_base64=body.image_base64)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[DetectType API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/long-panels",
    response_model=LongPanelsCropResponse,
    summary="Batch-slice multiple panel bounding boxes from a tall webtoon strip"
)
async def long_panels_crop_endpoint(body: LongPanelsCropRequest):
    """Slices all detected panel boxes in parallel and uploads/caches sliced panel assets."""
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Image URL is required.")
        if not body.panels:
            raise HTTPException(status_code=400, detail="List of panel bounding boxes is required.")
        return await crop_long_panels_batch(body)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[LongPanelsCrop API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post(
    "/small-panels",
    response_model=SmallPanelsCropResponse,
    summary="Crop directional margins (Top, Bottom, Left, Right) on a single image"
)
async def small_panels_crop_endpoint(body: SmallPanelsCropRequest):
    """Trims directional margins with color-tolerance auto-trim and aspect ratio snapping."""
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Image URL is required.")

        raw_bytes = await download_image_to_memory(body.url)
        cropped_bytes, meta = crop_panel_margins(
            image_bytes=raw_bytes,
            crop_top=body.cropTop or 0.0,
            crop_bottom=body.cropBottom or 0.0,
            crop_left=body.cropLeft or 0.0,
            crop_right=body.cropRight or 0.0,
            unit="percent",
            auto_trim=bool(body.autoTrim),
            aspect_ratio=body.aspectRatio,
            output_format=body.outputFormat or "PNG"
        )

        from database.supabase import upload_to_supabase_bucket
        from app.core.cache import stitched_cache
        import uuid, asyncio

        filename = f"crop_{uuid.uuid4().hex[:8]}.{meta['format'].lower()}"
        content_type = f"image/{meta['format'].lower()}"

        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            cropped_bytes,
            "panels",
            filename,
            content_type
        )
        final_url = supabase_url or f"/api/v1/images/cached/{filename}"
        if not supabase_url:
            stitched_cache.set(filename, {"data": cropped_bytes, "content_type": content_type})

        return SmallPanelsCropResponse(
            success=True,
            url=final_url,
            width=meta["width"],
            height=meta["height"],
            aspectRatio=meta["aspect_ratio"],
            autoTrimmed=meta["auto_trimmed"]
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[SmallPanelsCrop API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
