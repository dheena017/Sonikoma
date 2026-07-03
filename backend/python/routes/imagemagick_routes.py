"""
backend/python/routes/imagemagick_routes.py
─────────────────────────────────────────────────────────────────────────────
Image transform routes powered by ImageMagick/Wand.
"""

import os
import sys
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.imagemagick_engine import (
    get_imagemagick_engine,
    ResizeMode,
    FilterType,
)

logger = logging.getLogger("sonikoma.routes.imagemagick_routes")
router = APIRouter()
imagemagick = get_imagemagick_engine()


class ImagePathRequest(BaseModel):
    image_path: str
    output_path: Optional[str] = None


class ResizeImageRequest(ImagePathRequest):
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    filter_type: Optional[FilterType] = FilterType.LANCZOS
    quality: Optional[int] = Field(85, ge=1, le=100)


class RotateImageRequest(ImagePathRequest):
    angle: float = Field(..., description="Rotation angle in degrees")
    background_color: Optional[str] = "white"


class EnhanceImageRequest(ImagePathRequest):
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


class BatchResizeRequest(BaseModel):
    image_paths: List[str]
    output_dir: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    quality: Optional[int] = Field(85, ge=1, le=100)


class CompositeRequest(BaseModel):
    base_image_path: str
    overlay_image_path: str
    output_path: Optional[str] = None
    x: Optional[int] = 0
    y: Optional[int] = 0
    opacity: Optional[float] = Field(1.0, ge=0.0, le=1.0)


class MetadataRequest(BaseModel):
    image_path: str


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}{suffix}")


@router.post("/resize", summary="Resize an image")
async def resize_image(body: ResizeImageRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.resize(
            body.image_path,
            output_path,
            width=body.width,
            height=body.height,
            mode=body.mode,
            filter_type=body.filter_type,
            quality=body.quality,
        )
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Resize failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rotate", summary="Rotate an image")
async def rotate_image(body: RotateImageRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.rotate(body.image_path, output_path, angle=body.angle, background_color=body.background_color)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Rotate failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/enhance", summary="Auto-enhance image color")
async def enhance_image(body: EnhanceImageRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.auto_enhance(
            body.image_path,
            output_path,
            brightness=body.brightness,
            contrast=body.contrast,
            saturation=body.saturation,
        )
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Enhance failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/remove-background", summary="Remove image background")
async def remove_background(body: RemoveBackgroundRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.remove_background(body.image_path, output_path, fuzz_threshold=body.fuzz_threshold)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Remove background failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/add-text", summary="Add text overlay to an image")
async def add_text(body: AddTextRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.add_text_overlay(
            body.image_path,
            output_path,
            text=body.text,
            font_size=body.font_size,
            text_color=body.text_color,
            position=body.position,
            opacity=body.opacity,
        )
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Add text failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-resize", summary="Resize many images in parallel")
async def batch_resize(body: BatchResizeRequest):
    output_dir = body.output_dir or os.path.join(tempfile.gettempdir(), "imagemagick_batch")
    try:
        results = await imagemagick.batch_resize(
            body.image_paths,
            output_dir,
            width=body.width,
            height=body.height,
            mode=body.mode,
            quality=body.quality,
        )
        return {"success": True, "output_paths": results}
    except Exception as exc:
        logger.error(f"Batch resize failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/composite", summary="Composite one image over another")
async def composite_images(body: CompositeRequest):
    output_path = body.output_path or _default_output_path(".png")
    try:
        result = await imagemagick.composite_images(
            body.base_image_path,
            body.overlay_image_path,
            output_path,
            x=body.x,
            y=body.y,
            opacity=body.opacity,
        )
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Composite images failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/metadata", summary="Extract image metadata")
async def get_metadata(body: MetadataRequest):
    try:
        metadata = await imagemagick.get_metadata(body.image_path)
        return {"success": True, "metadata": metadata.__dict__}
    except Exception as exc:
        logger.error(f"Get metadata failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
