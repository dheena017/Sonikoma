"""
backend/app/api/v1/images/crop.py
─────────────────────────────────────────────────────────────────────────────
Crop API Router:
1. POST /detect-type  -> 5-layer layout & comic format classifier
2. POST /long-panels  -> High-speed multi-panel batch slicer (Webtoons / Strips)
3. POST /single-panels-> 4-directional margin cropper (Above, Bottom, Left, Right)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException, Request

from schemas.crop import (
    DetectTypeRequest,
    DetectTypeResponse,
    LongPanelsCropRequest,
    LongPanelsCropResponse,
    SinglePanelsCropRequest,
    SinglePanelsCropResponse
)
from services.image.crop import (
    detect_image_layout_type,
    crop_long_panels_batch,
    crop_single_panels_margins
)

logger = logging.getLogger("sonikoma.api.images.crop")
router = APIRouter()


@router.post(
    "/detect-type",
    response_model=DetectTypeResponse,
    summary="Classify image layout, reading flow, and optimal cropping parameters",
    description="Analyzes image aspect ratio, background color palette, edge complexity, and gutter valleys to detect comic format in <30ms."
)
async def detect_type_endpoint(body: DetectTypeRequest):
    try:
        if not body.url and not body.image_base64:
            raise HTTPException(status_code=400, detail="Must provide 'url' or 'image_base64'.")
        return await detect_image_layout_type(url=body.url, image_base64=body.image_base64)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[DetectType API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/long-panels",
    response_model=LongPanelsCropResponse,
    summary="Batch-slice multiple panel bounding boxes from a tall webtoon strip",
    description="Slices all detected panel boxes in parallel using in-memory zero-copy decoding and attaches full panel-to-asset binding metadata."
)
async def long_panels_crop_endpoint(body: LongPanelsCropRequest):
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Image URL is required.")
        if not body.panels:
            raise HTTPException(status_code=400, detail="List of panel bounding boxes is required.")
        return await crop_long_panels_batch(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LongPanelsCrop API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/single-panels",
    response_model=SinglePanelsCropResponse,
    summary="Crop directional margins (Above, Bottom, Left, Right) on a single image",
    description="Trims directional margins with color-tolerance auto-trim and aspect ratio snapping."
)
async def single_panels_crop_endpoint(body: SinglePanelsCropRequest):
    try:
        if not body.url:
            raise HTTPException(status_code=400, detail="Image URL is required.")
        return await crop_single_panels_margins(body)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SinglePanelsCrop API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Backward compatibility aliases for multi-slice
@router.post("/multi-slice", include_in_schema=False)
async def multi_slice_alias(body: LongPanelsCropRequest):
    return await crop_long_panels_batch(body)


@router.post("/margins", include_in_schema=False)
async def margins_crop_alias(body: SinglePanelsCropRequest):
    return await crop_single_panels_margins(body)
