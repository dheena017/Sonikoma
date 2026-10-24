"""
backend/features/image/router/transform.py
─────────────────────────────────────────────────────────────────────────────
Image Transformation & Compositing Router:
- Pixel transformations: Resize, Rotate, Enhance, Background Removal, Text Overlay
- Multi-image canvas stitching and ZIP / CBZ comic archive packaging
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import asyncio
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from features.image.schemas import (
    ResizeMode,
    FilterType,
    ImagePathRequest,
    StitchImagesRequest,
    DownloadZipRequest,
)
from features.image.utils.media_utils import download_image_to_memory
from features.image.transform.resize_service import resize_image
from features.image.transform.rotate_service import rotate_image
from features.image.transform.enhance_service import enhance_image
from features.image.transform.background_remover_service import remove_solid_background
from features.image.transform.text_overlay_service import overlay_text
from features.image.stitching.merge_service import merge_image_panels
from features.image.archive.zip_downloader_service import download_and_bundle_zip
from features.image.archive.archive_exporter_service import export_comic_archive
from database.supabase import upload_to_supabase_bucket
from app.core.cache import stitched_cache

logger = logging.getLogger("sonikoma.features.image.router.transform")
router = APIRouter()


# ── Transform Request Models ──────────────────────────────────────────────────

class ResizeRequest(ImagePathRequest):
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    filter_type: Optional[FilterType] = FilterType.LANCZOS
    quality: Optional[int] = Field(85, ge=1, le=100)


class RotateRequest(ImagePathRequest):
    angle: float = Field(..., description="Rotation angle in degrees")
    background_color: Optional[str] = "white"


class EnhanceRequest(ImagePathRequest):
    brightness: Optional[float] = Field(1.0, ge=0.1, le=3.0)
    contrast: Optional[float] = Field(1.0, ge=0.1, le=3.0)
    saturation: Optional[float] = Field(1.0, ge=0.1, le=3.0)
    sharpness: Optional[float] = Field(1.0, ge=0.1, le=3.0)


class RemoveBgRequest(ImagePathRequest):
    fuzz_threshold: Optional[int] = Field(30, ge=0, le=100)


class TextOverlayRequest(ImagePathRequest):
    text: str
    font_size: Optional[int] = 40
    text_color: Optional[str] = "white"
    position: Optional[str] = "center"
    opacity: Optional[float] = 1.0


class ExportArchiveRequest(BaseModel):
    image_urls: List[str]
    title: Optional[str] = "Webtoon Chapter"
    author: Optional[str] = "Unknown"
    format: Optional[str] = "cbz"


# ── Helper to save transformed buffer ─────────────────────────────────────────

async def _save_and_respond(data: bytes, prefix: str = "trans", fmt: str = "png") -> dict:
    ext = fmt.lower()
    filename = f"{prefix}_{uuid.uuid4().hex[:8]}.{ext}"
    ctype = f"image/{ext}"

    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        data,
        "panels",
        filename,
        ctype
    )
    final_url = supabase_url or f"/api/v1/images/cached/{filename}"
    if not supabase_url:
        stitched_cache.set(filename, {"data": data, "content_type": ctype})

    return {"success": True, "url": final_url}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/resize", summary="Resize image using Lanczos resampling")
async def resize_endpoint(body: ResizeRequest):
    try:
        buf = await download_image_to_memory(body.url)
        res = resize_image(
            image_bytes=buf,
            width=body.width,
            height=body.height,
            mode=body.mode or ResizeMode.FIT,
            filter_type=body.filter_type or FilterType.LANCZOS,
            quality=body.quality or 85
        )
        return await _save_and_respond(res, prefix="resize")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rotate", summary="Rotate image by specified degrees")
async def rotate_endpoint(body: RotateRequest):
    try:
        buf = await download_image_to_memory(body.url)
        res = rotate_image(
            image_bytes=buf,
            angle=body.angle,
            background_color=body.background_color or "white"
        )
        return await _save_and_respond(res, prefix="rotate")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/enhance", summary="Adjust brightness, contrast, and saturation")
async def enhance_endpoint(body: EnhanceRequest):
    try:
        buf = await download_image_to_memory(body.url)
        res = enhance_image(
            image_bytes=buf,
            brightness=body.brightness or 1.0,
            contrast=body.contrast or 1.0,
            saturation=body.saturation or 1.0,
            sharpness=body.sharpness or 1.0
        )
        return await _save_and_respond(res, prefix="enhance")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/remove-bg", summary="Remove solid backdrop color with alpha transparency")
async def remove_bg_endpoint(body: RemoveBgRequest):
    try:
        buf = await download_image_to_memory(body.url)
        res = remove_solid_background(image_bytes=buf, fuzz_threshold=body.fuzz_threshold or 30)
        return await _save_and_respond(res, prefix="nobg", fmt="png")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/text-overlay", summary="Render typography or watermark onto image")
async def text_overlay_endpoint(body: TextOverlayRequest):
    try:
        buf = await download_image_to_memory(body.url)
        res = overlay_text(
            image_bytes=buf,
            text=body.text,
            font_size=body.font_size or 40,
            text_color=body.text_color or "white",
            position=body.position or "center",
            opacity=body.opacity or 1.0
        )
        return await _save_and_respond(res, prefix="text")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/stitch", summary="Merge multiple images into a stitched canvas strip")
async def stitch_endpoint(body: StitchImagesRequest):
    try:
        urls = body.urls or (body.images if hasattr(body, "images") else [])
        if not urls:
            raise HTTPException(status_code=400, detail="Must provide a list of image URLs.")

        res = await merge_image_panels(
            images=urls,
            layout="vertical" if getattr(body, "direction", "vertical") == "vertical" else "horizontal",
            spacing=getattr(body, "gap", 0) or 0,
            spacing_color=getattr(body, "backgroundColor", "white") or "white"
        )
        return await _save_and_respond(res, prefix="stitch")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/download-zip", summary="Bundle image URLs into a downloadable zip archive")
async def download_zip_endpoint(body: DownloadZipRequest):
    try:
        urls = body.urls or []
        if not urls:
            raise HTTPException(status_code=400, detail="List of image URLs cannot be empty.")
        zip_bytes = await download_and_bundle_zip(urls)
        return Response(content=zip_bytes, media_type="application/zip")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/export-archive", summary="Export comic chapters as .cbz / .zip with ComicInfo.xml")
async def export_archive_endpoint(body: ExportArchiveRequest):
    try:
        images_data = []
        for url in body.image_urls:
            buf = await download_image_to_memory(url)
            images_data.append({"data": buf, "content_type": "image/png"})

        metadata = {"title": body.title, "author": body.author}
        archive_bytes = export_comic_archive(images_data, metadata, archive_format=body.format or "cbz")

        media_type = "application/vnd.comicbook+zip" if (body.format or "").lower() == "cbz" else "application/zip"
        return Response(content=archive_bytes, media_type=media_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
