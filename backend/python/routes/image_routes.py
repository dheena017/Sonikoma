"""
backend/python/routes/image_routes.py
─────────────────────────────────────────────────────────────────────────────
Unified router for all image manipulation operations: editing, stitching,
transforming, splitting, bubble-cleaning, and ZIP packaging.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
import io
import os
import tempfile
import zipfile
import asyncio
from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Response, Query, Body, Path
from pydantic import BaseModel, Field
from PIL import Image
import uuid

import utils.image_utils as img_utils
from utils.cache import stitched_cache, edit_history, zip_cache
from services.cleaner import remove_speech_bubbles
from utils.supabase_storage import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.routes.image_routes")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class EditImageRequest(BaseModel):
    url: str
    cropTop: Optional[float] = 0.0
    cropBottom: Optional[float] = 0.0
    cropLeft: Optional[float] = 0.0
    cropRight: Optional[float] = 0.0
    autoTrim: Optional[bool] = True
    sensitivity: Optional[float] = None
    padding: Optional[int] = None
    backgroundColorMode: Optional[str] = "auto"
    rotate: Optional[float] = 0.0
    flipHorizontal: Optional[bool] = False
    aspectRatio: Optional[str] = "free"
    outputFormat: Optional[str] = "jpeg"
    cropQuality: Optional[int] = 90

class UndoCropRequest(BaseModel):
    url: str

class TransformImageRequest(BaseModel):
    url: str
    type: Literal["rotate", "flip"]
    value: str

class StitchImagesRequest(BaseModel):
    url1: Optional[str] = None
    url2: Optional[str] = None
    imageUrl1: Optional[str] = None
    imageUrl2: Optional[str] = None
    urls: Optional[List[str]] = None
    layout: Optional[Literal["vertical", "horizontal"]] = "vertical"
    spacing: Optional[int] = 0
    spacingColor: Optional[str] = "white"
    scaleToFit: Optional[bool] = True
    alignMode: Optional[Literal["center", "start", "end"]] = "center"
    padding: Optional[int] = 0

class SplitImagesRequest(BaseModel):
    url: str
    splitLines: List[float]

class DownloadZipRequest(BaseModel):
    urls: List[str]
    url: Optional[str] = None

class RemoveBubblesRequest(BaseModel):
    url: str
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"

class RemoveBubblesBatchRequest(BaseModel):
    urls: List[str]
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


# ─── Image Editing & Transform Routes ──────────────────────────────────────────

@router.post("/edit", summary="Crop, rotate, and auto-trim an image panel")
async def edit_image(body: EditImageRequest):
    logger.info(f"[Image Edit] Request received for URL: {body.url[:60]}...")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img_buffer = resolved["data"]
        content_type = resolved["contentType"]

        def edit_sync():
            nonlocal img_buffer, content_type
            # Apply rotation if requested
            rotate_angle = body.rotate
            if rotate_angle and rotate_angle != 0:
                img = Image.open(io.BytesIO(img_buffer))
                img = img.rotate(rotate_angle, expand=True)
                out = io.BytesIO()
                img.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

            # Apply horizontal flip
            if body.flipHorizontal:
                img = Image.open(io.BytesIO(img_buffer))
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
                out = io.BytesIO()
                img.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

            # Crop percent-based boxes
            if body.cropTop > 0 or body.cropBottom > 0 or body.cropLeft > 0 or body.cropRight > 0:
                img = Image.open(io.BytesIO(img_buffer))
                w, h = img.size
                
                top_px = int(round((body.cropTop / 100) * h))
                bot_px = int(round((body.cropBottom / 100) * h))
                left_px = int(round((body.cropLeft / 100) * w))
                right_px = int(round((body.cropRight / 100) * w))

                crop_w = w - left_px - right_px
                crop_h = h - top_px - bot_px
                if crop_w > 10 and crop_h > 10:
                    img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                    out = io.BytesIO()
                    img_cropped.save(out, format=img.format or 'JPEG')
                    img_buffer = out.getvalue()

            # Auto trim borders
            if body.autoTrim:
                trimmed = img_utils.crop_auto_borders(
                    img_buffer,
                    tighter=True,
                    crop_padding=body.padding,
                    sensitivity=body.sensitivity,
                    background_color_mode=body.backgroundColorMode,
                    aspect_ratio=body.aspectRatio,
                    output_format=body.outputFormat,
                    crop_quality=body.cropQuality
                )
                img_buffer = trimmed["data"]
                content_type = trimmed["content_type"]
            return img_buffer, content_type

        img_buffer, content_type = await asyncio.to_thread(edit_sync)

        # Attempt to upload to Supabase
        filename = f"edited_{uuid.uuid4().hex[:8]}.jpeg" if "jpeg" in content_type or "jpg" in content_type else f"edited_{uuid.uuid4().hex[:8]}.png"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket, 
            img_buffer, 
            "panels", 
            filename, 
            content_type
        )

        unique_id = f"merged_{int(time.time() * 1000)}_cropped"
        new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"
        
        # Always cache locally as a fallback or fast-access path
        stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
        edit_history.set(new_url, body.url)

        logger.info(f"[Image Edit] Successfully edited image. URL: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Edit API] Error editing image frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image frame editing failed: {e}")


@router.post("/undo-crop", summary="Restore previous crop state of an edited image")
async def undo_crop(body: UndoCropRequest):
    prev = edit_history.get(body.url)
    if not prev:
        raise HTTPException(status_code=404, detail="No previous crop state found in session history.")
    return {"success": True, "previous_url": prev}


@router.post("/transform", summary="Rotate or flip image frame")
async def transform_image(body: TransformImageRequest):
    logger.info(f"[Transform] Request: {body.type} {body.value} for {body.url[:60]}...")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        img = Image.open(io.BytesIO(resolved["data"]))

        if body.type == "rotate":
            degrees = int(body.value)
            if degrees not in (90, -90, 180):
                raise HTTPException(status_code=400, detail="Invalid rotation angle. Use 90, -90, or 180.")
            img = img.rotate(degrees, expand=True)
        elif body.type == "flip":
            if body.value == "h":
                img = img.transpose(Image.FLIP_LEFT_RIGHT)
            elif body.value == "v":
                img = img.transpose(Image.FLIP_TOP_BOTTOM)
            else:
                raise HTTPException(status_code=400, detail="Invalid flip axis. Use 'h' or 'v'.")

        out = io.BytesIO()
        img.save(out, format="JPEG", quality=92)
        out_bytes = out.getvalue()

        filename = f"transform_{uuid.uuid4().hex[:8]}.jpeg"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket, 
            out_bytes, 
            "panels", 
            filename, 
            "image/jpeg"
        )

        unique_id = f"transform_{int(time.time() * 1000)}"
        proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

        stitched_cache.set(unique_id, {"data": out_bytes, "content_type": "image/jpeg"})
        edit_history.set(proxy_url, body.url)

        logger.info(f"[Transform] Successfully transformed image. URL: {proxy_url}")
        return {"success": True, "url": proxy_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Transform API] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── Image Merging & Stacking Routes ───────────────────────────────────────────

@router.post("/merge", summary="Stitch multiple panels vertically/horizontally")
async def merge_images(body: StitchImagesRequest):
    logger.info(f"[Merge] Request received for {len(body.urls) if body.urls else 2} images.")
    try:
        # Build URLs
        urls = body.urls
        if not urls:
            img1 = body.imageUrl1 or body.url1
            img2 = body.imageUrl2 or body.url2
            if img1 and img2:
                urls = [img1, img2]
                
        if not urls or len(urls) < 2:
            raise HTTPException(status_code=400, detail="At least 2 image URLs are required.")

        # Resolve image buffers
        resolved = [await img_utils.resolve_image_to_buffer(u) for u in urls]

        merged_bytes = await asyncio.to_thread(
            img_utils.stitch_images_together,
            image_buffers=[r["data"] for r in resolved],
            layout=body.layout,
            spacing=body.spacing,
            spacing_color=body.spacingColor,
            scale_to_fit=body.scaleToFit,
            align_mode=body.alignMode,
            padding=body.padding
        )

        filename = f"merged_{uuid.uuid4().hex[:8]}.png"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket, 
            merged_bytes, 
            "panels", 
            filename, 
            "image/png"
        )

        unique_id = f"merged_{int(time.time() * 1000)}_merged"
        new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

        stitched_cache.set(unique_id, {"data": merged_bytes, "content_type": "image/png"})
        edit_history.set(new_url, urls[0])

        logger.info(f"[Merge] Successfully stitched images. URL: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Merge API] Error stitching images: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image merging failed: {e}")


@router.get("/cached/{cache_id}", summary="Retrieve stitched cached panel image")
async def get_cached_stitch(cache_id: str = Path(...)):
    cached = stitched_cache.get(cache_id)
    if cached:
        return Response(
            content=cached["data"],
            media_type=cached["content_type"],
            headers={"Cache-Control": "public, max-age=86400"}
        )

    cached_url_key = f"/api/image/cached/{cache_id}"

    # Fallback 1: edit_history in-memory/disk cache (maps cached_url → original_url)
    original_url = edit_history.get(cached_url_key)

    # Fallback 2: SQLite panels table — look up the original_url stored alongside image_url
    if not original_url:
        try:
            import database.db as db
            original_url = db.get_panel_original_url(cached_url_key)
        except Exception:
            pass

    if original_url and isinstance(original_url, str):
        try:
            logger.info(f"[Cache] Miss for {cache_id} — re-fetching from original: {original_url[:80]}")
            resolved = await img_utils.resolve_image_to_buffer(original_url)
            img_bytes = resolved["data"]
            content_type = resolved.get("contentType", "image/jpeg")
            # Re-populate both caches so subsequent requests are instant
            stitched_cache.set(cache_id, {"data": img_bytes, "content_type": content_type})
            edit_history.set(cached_url_key, original_url)
            return Response(
                content=img_bytes,
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"}
            )
        except Exception as refetch_err:
            logger.warning(f"[Cache] Re-fetch failed for {cache_id}: {refetch_err}")

    raise HTTPException(status_code=404, detail="Stitched resource expired or not found.")


# ─── Image Splitting Route ─────────────────────────────────────────────────────

@router.post("/split", summary="Split strip image into separate panels")
async def execute_splits(body: SplitImagesRequest):
    logger.info(f"[Split] Request received for {body.url[:60]}...")
    try:
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        image_buffer = resolved["data"]
        
        def split_sync():
            img = Image.open(io.BytesIO(image_buffer))
            w, h = img.size
            
            # Map percentage lines to absolute pixel y-coords
            y_coords = sorted([int(round((pct / 100.0) * h)) for pct in body.splitLines])
            # Add boundary edges
            if 0 not in y_coords:
                y_coords.insert(0, 0)
            if h not in y_coords:
                y_coords.append(h)
                
            res_urls = []
            for i in range(len(y_coords) - 1):
                y_top = y_coords[i]
                y_bottom = y_coords[i+1]
                if (y_bottom - y_top) <= 5:
                    continue # Skip micro-slices
                    
                seg = img.crop((0, y_top, w, y_bottom))
                out = io.BytesIO()
                seg.save(out, format="JPEG", quality=92)
                seg_bytes = out.getvalue()

                # Trim margins conservatively
                try:
                    trimmed = img_utils.crop_auto_borders(
                        seg_bytes,
                        tighter=True,
                        crop_padding=0,
                        sensitivity=30.0,
                        background_color_mode='auto',
                        aspect_ratio='free',
                        output_format='jpeg',
                        crop_quality=90
                    )
                    seg_bytes = trimmed["data"]
                except Exception:
                    pass

                filename = f"split_{uuid.uuid4().hex[:8]}_{i}.jpeg"
                # Since split_sync runs in a thread, we use upload_to_supabase_bucket directly
                supabase_url = upload_to_supabase_bucket(
                    seg_bytes, 
                    "panels", 
                    filename, 
                    "image/jpeg"
                )

                cache_id = f"split_{int(time.time() * 1000)}_{i}"
                new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

                stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": "image/jpeg"})
                res_urls.append(new_url)
            return res_urls

        urls = await asyncio.to_thread(split_sync)
        logger.info(f"[Split] Successfully split image into {len(urls)} segments.")
        return {"success": True, "urls": urls}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Split API] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── ZIP Packager Routes ────────────────────────────────────────────────────────
@router.post("/download-zip", summary="Create ZIP archive containing storyboard panels")
async def download_zip(body: DownloadZipRequest):
    logger.info(f"[ZIP API] Request received for {len(body.urls)} image URLs. url={body.url}")
    try:
        # Resolve all buffers asynchronously first
        resolved_buffers = []
        for url in body.urls:
            try:
                resolved = await img_utils.resolve_image_to_buffer(url)
                resolved_buffers.append(resolved)
            except Exception as ex:
                logger.warning(f"[ZIP API] Failed to resolve URL: {url} | {ex}")

        # Package ZIP in-memory on a background thread
        def generate_zip_sync():
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for idx, resolved in enumerate(resolved_buffers):
                    ext = "jpg"
                    ct = resolved.get("content_type") or resolved.get("contentType") or ""
                    if "png" in ct:
                        ext = "png"
                    elif "webp" in ct:
                        ext = "webp"
                    elif "gif" in ct:
                        ext = "gif"
                        
                    filename = f"panel_{idx + 1:03d}.{ext}"
                    zip_file.writestr(filename, resolved["data"])
            return zip_buffer.getvalue()

        zip_bytes = await asyncio.to_thread(generate_zip_sync)
        
        # Build custom filename
        zip_filename = "comic_panels_archive.zip"
        if body.url:
            try:
                import re
                from utils.url_utils import parse_webtoon_url
                
                parsed = parse_webtoon_url(body.url)
                
                def make_safe_filename(name: str) -> str:
                    cleaned = re.sub(r'[^\w\s-]', '', name)
                    cleaned = re.sub(r'[-\s]+', '_', cleaned)
                    return cleaned.strip('_')
                
                source = make_safe_filename(parsed.get("source_name", "Source"))
                title = make_safe_filename(parsed.get("title", "Manhwa"))
                episode = make_safe_filename(parsed.get("episode", "Chapter"))
                
                if source or title or episode:
                    parts = []
                    if source and source.lower() != "custom_source" and source.lower() != "custom":
                        parts.append(source)
                    if title and title.lower() != "custom_storyboard" and title.lower() != "comic":
                        parts.append(title)
                    if episode and episode.lower() != "dynamic_chapter":
                        parts.append(episode)
                    
                    if parts:
                        zip_filename = "_".join(parts) + ".zip"
            except Exception as e:
                logger.warning(f"[ZIP API] Failed to construct safe filename from URL: {e}")

        zip_id = f"zip_{int(time.time() * 1000)}"
        zip_cache.set(zip_id, {"data": zip_bytes, "filename": zip_filename})

        logger.info(f"[ZIP API] Successfully generated ZIP archive with ID: {zip_id}, filename: {zip_filename}")
        return {"success": True, "downloadUrl": f"/api/image/download-zip/get/{zip_id}", "filename": zip_filename}
    except Exception as e:
        logger.error(f"[ZIP API Error] Generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"ZIP packaging failed: {e}")


@router.get("/download-zip/get/{zip_id}", summary="Download packaged ZIP archive")
async def get_download_zip(zip_id: str = Path(...)):
    cached = zip_cache.get(zip_id)
    if not cached:
        raise HTTPException(
            status_code=404, 
            detail="The requested ZIP archive has expired or was not found. Please package again."
        )
        
    if isinstance(cached, dict):
        buffer = cached["data"]
        filename = cached.get("filename", "comic_panels_archive.zip")
    else:
        buffer = cached
        filename = "comic_panels_archive.zip"
        
    return Response(
        content=buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
# ─── Speech Bubble Removal Route (migrated from Express image/cleanup.ts) ──────

@router.post("/remove-speech-bubbles", summary="Inpaint speech bubbles out of a panel image")
async def bubble_cleaning(body: RemoveBubblesRequest):
    logger.info(f"[Bubble Cleaner] Request received for URL: {body.url[:60]}...")
    try:
        # 1. Resolve image
        resolved = await img_utils.resolve_image_to_buffer(body.url)
        content_type = resolved["contentType"]
        
        # 2. Write to temp file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name
            
        tmp_out_path = tmp_in_path.replace(".png", "_out.png")
        
        try:
            # 3. Call services/cleaner remove_speech_bubbles directly (no subprocess!)
            detected = await asyncio.to_thread(
                remove_speech_bubbles,
                image_path=tmp_in_path,
                output_path=tmp_out_path,
                method=body.method,
                sensitivity=body.sensitivity,
                dilation=body.dilation,
                inpaint_radius=body.inpaint_radius,
                detection_style=body.detection_style
            )
            
            with open(tmp_out_path, "rb") as f:
                cleaned_bytes = f.read()
                
            filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
            supabase_url = await asyncio.to_thread(
                upload_to_supabase_bucket, 
                cleaned_bytes, 
                "panels", 
                filename, 
                content_type
            )

            cache_id = f"merged_{int(time.time() * 1000)}_cleaned"
            new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"
            
            stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
            edit_history.set(new_url, body.url)
            
            logger.info(f"[Bubble Cleaner] Successfully cleaned bubbles. URL: {new_url}")
            return {"success": True, "url": new_url}
        finally:
            # Cleanup temp files
            for p in (tmp_in_path, tmp_out_path):
                try:
                    if os.path.exists(p):
                        os.remove(p)
                except OSError:
                    pass
    except Exception as e:
        logger.error(f"[Bubble Cleaner API Error] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Speech bubble cleaning failed: {e}")

@router.post("/remove-speech-bubbles-batch", summary="Inpaint speech bubbles out of multiple panel images")
async def bubble_cleaning_batch(body: RemoveBubblesBatchRequest):
    logger.info(f"[Bubble Cleaner Batch] Request received for {len(body.urls)} URLs.")
    
    if not body.urls:
        raise HTTPException(status_code=400, detail="Field 'urls' must be a non-empty list.")
    
    results = []
    semaphore = asyncio.Semaphore(4)

    async def process_one(url: str):
        async with semaphore:
            try:
                resolved = await img_utils.resolve_image_to_buffer(url)
                content_type = resolved["contentType"]
                
                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                    tmp_in.write(resolved["data"])
                    tmp_in_path = tmp_in.name
                    
                tmp_out_path = tmp_in_path.replace(".png", "_out.png")
                
                try:
                    detected = await asyncio.to_thread(
                        remove_speech_bubbles,
                        image_path=tmp_in_path,
                        output_path=tmp_out_path,
                        method=body.method,
                        sensitivity=body.sensitivity,
                        dilation=body.dilation,
                        inpaint_radius=body.inpaint_radius,
                        detection_style=body.detection_style
                    )
                    
                    with open(tmp_out_path, "rb") as f:
                        cleaned_bytes = f.read()
                        
                    filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
                    supabase_url = await asyncio.to_thread(
                        upload_to_supabase_bucket, 
                        cleaned_bytes, 
                        "panels", 
                        filename, 
                        content_type
                    )

                    cache_id = f"merged_{int(time.time() * 1000)}_cleaned_{hash(url) % 10000}"
                    new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"
                    
                    stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
                    edit_history.set(new_url, url)
                    
                    results.append({"url": url, "new_url": new_url, "success": True})
                finally:
                    for p in (tmp_in_path, tmp_out_path):
                        try:
                            if os.path.exists(p):
                                os.remove(p)
                        except OSError:
                            pass
            except Exception as e:
                logger.warning(f"[Bubble Cleaner Batch] Failed for URL {url[:50]}: {e}")
                results.append({"url": url, "success": False, "error": str(e)})

    tasks = [process_one(url) for url in body.urls]
    await asyncio.gather(*tasks)
    
    return {"success": True, "results": results}

from fastapi import UploadFile, File
import mimetypes

@router.post("/upload", summary="Upload an image manually (e.g. drawn panel) directly to Supabase")
async def upload_image(file: UploadFile = File(...)):
    logger.info(f"[Image Upload] Manual upload received: {file.filename}")
    try:
        file_bytes = await file.read()
        content_type = file.content_type or "application/octet-stream"
        
        # If no explicit content type but filename provided, try to guess
        if content_type == "application/octet-stream" and file.filename:
            guessed_type, _ = mimetypes.guess_type(file.filename)
            if guessed_type:
                content_type = guessed_type

        ext = "png"
        if "jpeg" in content_type or "jpg" in content_type:
            ext = "jpeg"
        elif "webp" in content_type:
            ext = "webp"
        elif "gif" in content_type:
            ext = "gif"
            
        filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"
        
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket, 
            file_bytes, 
            "panels", 
            filename, 
            content_type
        )
        
        if supabase_url:
            new_url = supabase_url
        else:
            # Fallback to local stitched_cache if Supabase not configured
            cache_id = f"upload_{int(time.time() * 1000)}"
            stitched_cache.set(cache_id, {"data": file_bytes, "content_type": content_type})
            new_url = f"/api/image/cached/{cache_id}"
            
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Image Upload] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
