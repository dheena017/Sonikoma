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

from services.image.processing.imagemagick import ResizeMode, FilterType
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
from services.image.processing.edit import transform_image_service
from services.image.processing.compose import (
    merge_images_service,
    execute_splits_service,
    download_zip_service,
)
from services.image.layer_separation.layer_separator import extract_panel_layers_service
from services.image.processing.image_transformer import (
    resize_image_service,
    rotate_image_service,
    apply_image_enhancements_service,
    remove_background_service,
    add_text_service,
    batch_resize_service,
    composite_images_service,
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
            trans_type=body.type,
            value=body.value,
        )
        return result
    except Exception as e:
        logger.error(f"[Transform API] Image transformation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/merge", summary="Stitch a series of panel segments vertically or horizontally")
async def merge_images(body: StitchImagesRequest):
    urls = body.urls or []
    if not urls:
        if body.url1 and body.url2:
            urls = [body.url1, body.url2]
        elif body.imageUrl1 and body.imageUrl2:
            urls = [body.imageUrl1, body.imageUrl2]

    if not urls:
        raise HTTPException(status_code=400, detail="Cannot stitch an empty list of image URLs.")

    layout = body.layout or body.direction or "vertical"
    align_mode = body.alignMode or body.alignment or "center"

    try:
        result = await merge_images_service(
            urls=urls,
            layout=layout,
            spacing=body.spacing or 0,
            spacingColor=body.spacingColor or "white",
            scaleToFit=body.scaleToFit if body.scaleToFit is not None else True,
            alignMode=align_mode,
            padding=body.padding or 0
        )
        return result
    except Exception as e:
        logger.error(f"[Stitch API] Error stitching panel list: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/cached/{cache_id}", summary="Retrieve stitched cached panel image")
async def get_cached_stitch(request: Request, cache_id: str = Path(...)):
    from services.image.stitching.stitch_cache_service import retrieve_cached_stitch_service, StitchedResourceNotFound
    try:
        referer = request.headers.get("referer") if request else None
        content_bytes, media_type = await retrieve_cached_stitch_service(cache_id, referer)
        return Response(
            content=content_bytes,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except StitchedResourceNotFound as e:
        logger.info(f"[Stitch Cache API] Missing/expired cache for '{cache_id}': {e}")
        raise HTTPException(status_code=410, detail=str(e))
    except Exception as e:
        logger.error(f"[Stitch Cache API] Error retrieving cache: {e}", exc_info=True)
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/split", summary="Split a webtoon strip vertically into individual panel files")
async def split_strip(body: SplitImagesRequest):
    try:
        split_points = body.split_points if body.split_points is not None else (body.splitLines or [])
        output_format = body.format or "jpeg"
        result = await execute_splits_service(body.url, split_points, output_format)
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
    from core.cache import zip_cache
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
        result = await resize_image_service(
            image_path=body.image_path,
            width=body.width,
            height=body.height,
            mode=body.mode,
            filter_type=body.filter_type,
            quality=body.quality
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Resize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rotate", summary="Rotate image by angle in degrees using ImageMagick")
async def rotate_image(body: RotateImageRequest):
    try:
        result = await rotate_image_service(
            image_path=body.image_path,
            angle=body.angle,
            background_color=body.background_color if body.background_color is not None else "white"
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Rotation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enhance", summary="Adjust brightness, contrast, and saturation using ImageMagick")
async def enhance_image(body: ImageEnhancementRequest):
    try:
        result = await apply_image_enhancements_service(
            image_path=body.image_path,
            brightness=body.brightness if body.brightness is not None else 1.0,
            contrast=body.contrast if body.contrast is not None else 1.0,
            saturation=body.saturation if body.saturation is not None else 1.0
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Enhancements failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-background", summary="Make specific background color transparent using fuzz threshold")
async def remove_background(body: RemoveBackgroundRequest):
    try:
        result = await remove_background_service(
            image_path=body.image_path,
            fuzz_threshold=body.fuzz_threshold if body.fuzz_threshold is not None else 30
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Background removal failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-text", summary="Draw text onto image using ImageMagick")
async def add_text(body: AddTextRequest):
    try:
        result = await add_text_service(
            image_path=body.image_path,
            text=body.text,
            font_size=body.font_size if body.font_size is not None else 40,
            text_color=body.text_color or "white",
            position=body.position or "center",
            opacity=body.opacity if body.opacity is not None else 1.0
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Add text failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-resize", summary="Resize a batch of images to a uniform width or height")
async def batch_resize(body: BatchResizeRequest):
    try:
        results = await batch_resize_service(
            image_paths=body.image_paths,
            width=body.width,
            height=body.height,
            mode=body.mode or ResizeMode.FIT
        )
        return {"success": True, "resized_images": results}
    except Exception as e:
        logger.error(f"[ImageMagick API] Batch resize failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/composite", summary="Composite/overlay one image onto another at a specific position")
async def composite_images(body: CompositeRequest):
    try:
        result = await composite_images_service(
            base_image_path=body.base_image_path,
            overlay_image_path=body.overlay_image_path,
            output_path=body.output_path,
            x=body.x if body.x is not None else 0,
            y=body.y if body.y is not None else 0,
            opacity=body.opacity if body.opacity is not None else 1.0,
        )
        return {"success": True, "image_path": result}
    except Exception as e:
        logger.error(f"[ImageMagick API] Composite failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
