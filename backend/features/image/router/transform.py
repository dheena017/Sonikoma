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
from typing import Optional, List, Literal, Union
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, Field

from features.image.schemas import (
    ResizeMode,
    FilterType,
    ImagePathRequest,
    StitchImagesRequest,
    SplitImagesRequest,
    TransformImageRequest,
    DownloadZipRequest,
)
from features.image.utils.media_utils import download_image_to_memory
from features.image.transform.resize_service import resize_image
from features.image.transform.rotate_service import rotate_image
from features.image.transform.flip_service import flip_image
from features.image.transform.enhance_service import enhance_image
from features.image.transform.background_remover_service import remove_solid_background
from features.image.transform.text_overlay_service import overlay_text
from features.image.stitching.merge_service import merge_image_panels
from features.image.crop.manual_split_service import cut_strip_at_positions
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
        target_url = body.url or body.image_path
        if not target_url:
            raise HTTPException(status_code=400, detail="Must provide an image URL or image_path.")
        buf = await download_image_to_memory(target_url)
        res = resize_image(
            image_bytes=buf,
            width=body.width,
            height=body.height,
            mode=body.mode or ResizeMode.FIT,
            filter_type=body.filter_type or FilterType.LANCZOS,
            quality=body.quality or 85
        )
        return await _save_and_respond(res, prefix="resize")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/rotate", summary="Rotate image by specified degrees")
async def rotate_endpoint(body: RotateRequest):
    try:
        target_url = body.url or body.image_path
        if not target_url:
            raise HTTPException(status_code=400, detail="Must provide an image URL or image_path.")
        buf = await download_image_to_memory(target_url)
        res = rotate_image(
            image_bytes=buf,
            angle=body.angle,
            background_color=body.background_color or "white"
        )
        return await _save_and_respond(res, prefix="rotate")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/enhance", summary="Adjust brightness, contrast, and saturation")
async def enhance_endpoint(body: EnhanceRequest):
    try:
        target_url = body.url or body.image_path
        if not target_url:
            raise HTTPException(status_code=400, detail="Must provide an image URL or image_path.")
        buf = await download_image_to_memory(target_url)
        res = enhance_image(
            image_bytes=buf,
            brightness=body.brightness or 1.0,
            contrast=body.contrast or 1.0,
            saturation=body.saturation or 1.0,
            sharpness=body.sharpness or 1.0
        )
        return await _save_and_respond(res, prefix="enhance")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/remove-bg", summary="Remove solid backdrop color with alpha transparency")
async def remove_bg_endpoint(body: RemoveBgRequest):
    try:
        target_url = body.url or body.image_path
        if not target_url:
            raise HTTPException(status_code=400, detail="Must provide an image URL or image_path.")
        buf = await download_image_to_memory(target_url)
        res = remove_solid_background(image_bytes=buf, fuzz_threshold=body.fuzz_threshold or 30)
        return await _save_and_respond(res, prefix="nobg", fmt="png")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/text-overlay", summary="Render typography or watermark onto image")
async def text_overlay_endpoint(body: TextOverlayRequest):
    try:
        target_url = body.url or body.image_path
        if not target_url:
            raise HTTPException(status_code=400, detail="Must provide an image URL or image_path.")
        buf = await download_image_to_memory(target_url)
        res = overlay_text(
            image_bytes=buf,
            text=body.text,
            font_size=body.font_size or 40,
            text_color=body.text_color or "white",
            position=body.position or "center",
            opacity=body.opacity or 1.0
        )
        return await _save_and_respond(res, prefix="text")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/stitch", summary="Merge multiple images into a stitched canvas strip")
@router.post("/merge", summary="Merge multiple images into a stitched canvas strip (alias)")
async def stitch_endpoint(body: StitchImagesRequest):
    try:
        urls: List[Union[str, bytes]] = []
        if body.urls:
            urls.extend(body.urls)
        elif body.url1 or body.imageUrl1:
            u1 = body.url1 or body.imageUrl1
            u2 = body.url2 or body.imageUrl2
            urls.extend([u for u in [u1, u2] if u])
        elif hasattr(body, "images") and getattr(body, "images"):
            raw_imgs = getattr(body, "images")
            if isinstance(raw_imgs, (list, tuple)):
                urls.extend([str(img) for img in raw_imgs if img])
        if not urls:
            raise HTTPException(status_code=400, detail="Must provide a list of image URLs.")

        raw_direction = str(body.layout or body.direction or "vertical").lower()
        layout_mode: Literal["vertical", "horizontal"] = "horizontal" if raw_direction == "horizontal" else "vertical"

        raw_gap = body.spacing if body.spacing is not None else getattr(body, "gap", 0)
        gap: int = int(raw_gap) if raw_gap is not None else 0

        bg_color = str(body.spacingColor or getattr(body, "backgroundColor", "white") or "white")

        raw_align = str(body.alignMode or body.alignment or "center").lower()
        align_mode: Literal["center", "start", "end"] = "start" if raw_align == "start" else ("end" if raw_align == "end" else "center")

        raw_padding = body.padding if body.padding is not None else getattr(body, "padding", 0)
        padding: int = int(raw_padding) if raw_padding is not None else 0

        fmt = str(body.format or "PNG")

        res = await merge_image_panels(
            images=urls,
            layout=layout_mode,
            spacing=gap,
            spacing_color=bg_color,
            align_mode=align_mode,
            padding=padding,
            output_format=fmt
        )
        return await _save_and_respond(res, prefix="stitch")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Stitch API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/split", summary="Split continuous comic strip along user-specified percentage cut positions")
async def split_endpoint(body: SplitImagesRequest):
    try:
        if not body.url or not body.url.strip():
            raise HTTPException(status_code=400, detail="Must provide a valid source image URL.")
        cuts = body.splitLines if body.splitLines is not None else (body.split_points or [])
        res = await cut_strip_at_positions(
            url=body.url,
            split_lines=cuts,
            output_format=body.format or "jpeg"
        )
        return {
            "success": True,
            "urls": res.get("urls", []),
            "count": len(res.get("urls", []))
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Split API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/transform", summary="Quick rotate or flip image transformation")
async def transform_endpoint(body: TransformImageRequest):
    try:
        if not body.url or not body.url.strip():
            raise HTTPException(status_code=400, detail="Must provide a valid source image URL.")
        buf = await download_image_to_memory(body.url)
        if body.type == "rotate":
            angle = float(body.value)
            res = rotate_image(image_bytes=buf, angle=angle)
        elif body.type == "flip":
            horizontal = (str(body.value).lower() in ("h", "horizontal", "true", "1"))
            res = flip_image(image_bytes=buf, horizontal=horizontal)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported transform type: {body.type}")
        return await _save_and_respond(res, prefix="trans")
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Transform API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/download-zip", summary="Bundle image URLs into a downloadable zip archive")
async def download_zip_endpoint(body: DownloadZipRequest):
    try:
        urls = body.urls or []
        if not urls:
            raise HTTPException(status_code=400, detail="List of image URLs cannot be empty.")
        zip_bytes = await download_and_bundle_zip(urls, referer=body.url)
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": 'attachment; filename="comic_panels_archive.zip"',
                "Content-Type": "application/zip",
            },
        )
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
