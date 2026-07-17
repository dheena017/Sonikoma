"""
backend/app/api/v1/images/transform.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for merging, splitting, compressing, and executing specific
pixel transformations (rotation, scaling, overlay text, composite, layer splits).
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Response, Path, Request
from pydantic import Field

from providers.media.imagemagick import ResizeMode, FilterType
from schemas.image import (
    TransformImageRequest,
    StitchImagesRequest,
    SplitImagesRequest,
    DownloadZipRequest,
    ProcessLayersRequest,
    BatchResizeRequest,
    CompositeRequest,
    ImagePathRequest,
)
from services.image.image_service import (
    transform_image_service,
    merge_images_service,
    execute_splits_service,
    download_zip_service,
    extract_panel_layers_service,
    resize_image_service,
    rotate_image_service,
    apply_image_enhancements_service,
    remove_background_service,
    add_text_service,
    batch_resize_service,
    composite_images_service
)


# ─── Inline Schemas (shared between edit.py and transform.py) ────────────────

class ResizeImageRequest(ImagePathRequest):
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    filter_type: Optional[FilterType] = FilterType.LANCZOS
    quality: Optional[int] = Field(85, ge=1, le=100)


class RotateImageRequest(ImagePathRequest):
    angle: float = Field(..., description="Rotation angle in degrees")
    background_color: Optional[str] = "white"


class ImageEnhancementRequest(ImagePathRequest):
    brightness: Optional[float] = Field(1.0, ge=0.1, le=3.0)
    contrast: Optional[float] = Field(1.0, ge=0.1, le=3.0)
    saturation: Optional[float] = Field(1.0, ge=0.1, le=3.0)


class RemoveBackgroundRequest(ImagePathRequest):
    fuzz_threshold: Optional[int] = Field(30, ge=0, le=100)


class AddTextRequest(ImagePathRequest):
    text: str
    font_size: Optional[int] = Field(40, ge=8, le=200)
    text_color: Optional[str] = "white"
    position: Optional[str] = "center"
    opacity: Optional[float] = Field(1.0, ge=0.0, le=1.0)

logger = logging.getLogger("sonikoma.api.images.transform")
router = APIRouter()


@router.post("/transform", summary="Apply geometric transformations (scaling, rotation, flip)")
async def transform_image(body: TransformImageRequest):
    try:
        result = await transform_image_service(
            url=body.url,
            scale_x=body.scaleX,
            scale_y=body.scaleY,
            rotation=body.rotation,
            flip_h=body.flipHorizontal,
            flip_v=body.flipVertical,
            quality=body.quality,
            format_str=body.format
        )
        return result
    except Exception as e:
        logger.error(f"[Transform API] Image transformation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/merge", summary="Stitch a series of panel segments vertically or horizontally")
async def merge_images(body: StitchImagesRequest):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Cannot stitch an empty list of image URLs.")
    try:
        result = await merge_images_service(body.urls, body.direction, body.alignment, body.spacing, body.format)
        return result
    except Exception as e:
        logger.error(f"[Stitch API] Error stitching panel list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cached/{cache_id}", summary="Retrieve stitched cached panel image")
async def get_cached_stitch(cache_id: str = Path(...), request: Request = None):
    from services.image.stitch_cache_service import retrieve_cached_stitch_service
    try:
        content_bytes, media_type = await retrieve_cached_stitch_service(cache_id, request)
        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except Exception as e:
        logger.error(f"[Stitch Cache API] Error retrieving cache: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/split", summary="Split a webtoon strip vertically into individual panel files")
async def split_strip(body: SplitImagesRequest):
    try:
        result = await execute_splits_service(body.url, body.split_points, body.format)
        return result
    except Exception as e:
        logger.error(f"[Split API] Error splitting strip layout: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download-zip", summary="Create and package individual panels in a compressed zip file")
async def download_zip(body: DownloadZipRequest):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty.")
    try:
        result = await download_zip_service(body.urls)
        return result
    except Exception as e:
        logger.error(f"[Zip API] Error packaging panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download-zip/get/{zip_id}", summary="Stream compiled zip archive payload directly")
async def get_download_zip(zip_id: str):
    from utils.cache import zip_cache
    zip_bytes = zip_cache.get(zip_id)
    if not zip_bytes:
        raise HTTPException(status_code=404, detail="Zip file expired or not found.")
    
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=panels_{zip_id[:8]}.zip"}
    )


@router.post("/process-layers/{panel_id}", summary="Segment panel image into parallax background, character, and text layers")
async def process_layers_endpoint(panel_id: str, body: ProcessLayersRequest):
    try:
        result = await extract_panel_layers_service(panel_id, body.url)
        return result
    except Exception as e:
        logger.error(f"[Layers API] Error processing segment layers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── ImageMagick Transformations ──────────────────────────────────────────────

@router.post("/resize", summary="Resize image using ImageMagick fit or cover mode")
async def resize_image(body: ResizeImageRequest):
    try:
        result = await resize_image_service(body.image_path, body.width, body.height, body.mode, body.filter_type, body.quality)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Resize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rotate", summary="Rotate image by angle in degrees using ImageMagick")
async def rotate_image(body: RotateImageRequest):
    try:
        result = await rotate_image_service(body.image_path, body.angle, body.background_color)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Rotation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance", summary="Adjust brightness, contrast, and saturation using ImageMagick")
async def enhance_image(body: ImageEnhancementRequest):
    try:
        result = await apply_image_enhancements_service(body.image_path, body.brightness, body.contrast, body.saturation)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Enhancements failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-background", summary="Make specific background color transparent using fuzz threshold")
async def remove_background(body: RemoveBackgroundRequest):
    try:
        result = await remove_background_service(body.image_path, body.fuzz_threshold)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Background removal failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-text", summary="Draw text onto image using ImageMagick")
async def add_text(body: AddTextRequest):
    try:
        result = await add_text_service(body.image_path, body.text, body.font_size, body.text_color, body.position, body.opacity)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Add text failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-resize", summary="Resize a batch of images to a uniform width or height")
async def batch_resize(body: BatchResizeRequest):
    try:
        results = await batch_resize_service(body.image_paths, body.width, body.height, body.mode)
        return {"success": True, "resized_images": results}
    except Exception as e:
        logger.error(f"[ImageMagick API] Batch resize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/composite", summary="Composite/overlay one image onto another at a specific position")
async def composite_images(body: CompositeRequest):
    try:
        result = await composite_images_service(body.base_image_path, body.overlay_image_path, body.x, body.y, body.opacity)
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Composite failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
