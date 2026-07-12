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
import mimetypes
import glob

from typing import List, Optional, Literal, Dict, Any
from fastapi import APIRouter, HTTPException, Response, Query, Body, Path, Request
from pydantic import BaseModel, Field
from PIL import Image
import uuid

import utils.image_utils as img_utils
from utils.cache import stitched_cache, edit_history, zip_cache
from media.image.cleaner import remove_speech_bubbles
from media.image.layer_segmentation import process_layers
from media.image.detect_panels import run_cv_detection
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

class UndoEditRequest(BaseModel):
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

class ProcessLayersRequest(BaseModel):
    url: str

class RemoveBubblesBatchRequest(BaseModel):
    urls: List[str]
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


# ─── Image Editing & Transform Routes ──────────────────────────────────────────

@router.post("/edit", summary="Edit, rotate, and auto-trim an image panel")
async def apply_image_edits(body: EditImageRequest):
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

        unique_id = f"merged_{int(time.time() * 1000)}_edited"
        new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

        # Always cache locally as a fallback or fast-access path
        stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
        edit_history.set(new_url, body.url)
        try:
            import database.db as db
            db.save_edit_history(new_url, body.url)
        except Exception:
            pass

        logger.info(f"[Image Edit] Successfully edited image. URL: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Edit API] Error editing image frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image frame editing failed: {e}")


@router.post("/undo-edit", summary="Restore previous edit state of an edited image")
async def undo_image_edit(body: UndoEditRequest):
    prev = edit_history.get(body.url)
    if not prev:
        raise HTTPException(status_code=404, detail="No previous edit state found in session history.")
    return {"success": True, "previous_url": prev}


@router.post("/crop", include_in_schema=False, summary="Backward-compatible alias for image edits")
async def apply_image_edit_alias(body: EditImageRequest):
    return await apply_image_edits(body)


@router.post("/undo-crop", include_in_schema=False, summary="Backward-compatible alias for undoing image edits")
async def undo_image_edit_alias(body: UndoEditRequest):
    return await undo_image_edit(body)


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
        try:
            import database.db as db
            db.save_edit_history(proxy_url, body.url)
        except Exception:
            pass

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
        try:
            import database.db as db
            db.save_edit_history(new_url, urls[0])
        except Exception:
            pass

        logger.info(f"[Merge] Successfully stitched images. URL: {new_url}")
        return {"success": True, "url": new_url}
    except Exception as e:
        logger.error(f"[Merge API] Error stitching images: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Image merging failed: {e}")


@router.get("/cached/{cache_id}", summary="Retrieve stitched cached panel image")
async def get_cached_stitch(cache_id: str = Path(...), request: Request = None):
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

    # Fallback 3: SQLite edit_history table lookup
    if not original_url:
        try:
            import database.db as db
            hist = db.get_edit_history(cached_url_key)
            if hist and hist.get("original_url"):
                original_url = hist["original_url"]
        except Exception:
            pass

    # Fallback 4: Scraper session / Referer fallback (for guest sessions & legacy norm_ URLs)
    if not original_url:
        import re
        index = None
        norm_match = re.match(r'^(?:norm|split)_(\d+)_(\d+)(?:_(\d+))?$', cache_id)
        if norm_match:
            index = int(norm_match.group(2))
        else:
            crop_match = re.search(r'smartcrop_(\d+)(?:_\d+)?$', cache_id)
            if crop_match:
                index = int(crop_match.group(1))

        if index is not None:
            try:
                import database.db as db
                webtoon_url = None
                referer = request.headers.get("referer") if request else None
                if referer:
                    from urllib.parse import urlparse, parse_qs
                    parsed_ref = urlparse(referer)
                    query_params = parse_qs(parsed_ref.query)
                    if "url" in query_params:
                        webtoon_url = query_params["url"][0]
                    else:
                        path_parts = [p for p in parsed_ref.path.split('/') if p]
                        if len(path_parts) >= 4 and path_parts[0] == "series":
                            series_slug = path_parts[1]
                            chapter_slug = path_parts[3]
                            conn = db.get_db_connection()
                            session_row = conn.execute(
                                "SELECT url FROM scrape_sessions WHERE url LIKE ? AND url LIKE ? ORDER BY scraped_at DESC LIMIT 1",
                                (f"%{series_slug}%", f"%{chapter_slug.replace('chapter-', 'episode-')}%")
                            ).fetchone()
                            if session_row:
                                webtoon_url = session_row["url"]

                if not webtoon_url:
                    conn = db.get_db_connection()
                    latest_session = conn.execute(
                        "SELECT url FROM scrape_sessions ORDER BY scraped_at DESC LIMIT 1"
                    ).fetchone()
                    if latest_session:
                        webtoon_url = latest_session["url"]

                if webtoon_url:
                    conn = db.get_db_connection()
                    session_row = conn.execute(
                        "SELECT image_urls FROM scrape_sessions WHERE url = ? AND image_urls LIKE '%http%' ORDER BY scraped_at ASC LIMIT 1",
                        (webtoon_url,)
                    ).fetchone()
                    if not session_row:
                        session_row = conn.execute(
                            "SELECT image_urls FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1",
                            (webtoon_url,)
                        ).fetchone()
                    if session_row:
                        import json
                        urls = json.loads(session_row["image_urls"])
                        if 0 <= index < len(urls):
                            from database.db import unwrap_proxy_url
                            original_url = unwrap_proxy_url(urls[index])
                            logger.info(f"[Cache Fallback] Resolved cache_id '{cache_id}' index {index} to original_url: {original_url}")
            except Exception as fe:
                logger.warning(f"[Cache Fallback] Scraper session lookup failed: {fe}")

    # Fallback 5: Dynamic re-stitching for full page stitched caches (cache_id matches stitched_..._full)
    if not original_url and re.match(r'^stitched_\d+_full(?:_\d+)?$', cache_id):
        try:
            import database.db as db
            import httpx
            webtoon_url = None
            referer = request.headers.get("referer") if request else None
            if referer:
                from urllib.parse import urlparse, parse_qs
                parsed_ref = urlparse(referer)
                query_params = parse_qs(parsed_ref.query)
                if "url" in query_params:
                    webtoon_url = query_params["url"][0]
                else:
                    path_parts = [p for p in parsed_ref.path.split('/') if p]
                    if len(path_parts) >= 4 and path_parts[0] == "series":
                        series_slug = path_parts[1]
                        chapter_slug = path_parts[3]
                        conn = db.get_db_connection()
                        session_row = conn.execute(
                            "SELECT url FROM scrape_sessions WHERE url LIKE ? AND url LIKE ? ORDER BY scraped_at DESC LIMIT 1",
                            (f"%{series_slug}%", f"%{chapter_slug.replace('chapter-', 'episode-')}%")
                        ).fetchone()
                        if session_row:
                            webtoon_url = session_row["url"]

            if not webtoon_url:
                conn = db.get_db_connection()
                latest_session = conn.execute(
                    "SELECT url FROM scrape_sessions ORDER BY scraped_at DESC LIMIT 1"
                ).fetchone()
                if latest_session:
                    webtoon_url = latest_session["url"]

            if webtoon_url:
                conn = db.get_db_connection()
                session_row = conn.execute(
                    "SELECT image_urls FROM scrape_sessions WHERE url = ? AND image_urls LIKE '%http%' ORDER BY scraped_at ASC LIMIT 1",
                    (webtoon_url,)
                ).fetchone()
                if not session_row:
                    session_row = conn.execute(
                        "SELECT image_urls FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1",
                        (webtoon_url,)
                    ).fetchone()
                if session_row:
                    import json
                    from database.db import unwrap_proxy_url
                    urls = json.loads(session_row["image_urls"])
                    unwrapped_urls = [unwrap_proxy_url(u) for u in urls if u]

                    if unwrapped_urls:
                        logger.info(f"[Cache Fallback] Dynamically re-stitching {len(unwrapped_urls)} panels for cache_id '{cache_id}' from Webtoon URL: {webtoon_url[:60]}...")
                        resolved_buffers_data = []
                        async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                            sem = asyncio.Semaphore(15)
                            async def fetch_item(u):
                                async with sem:
                                    return await img_utils.resolve_image_to_buffer(u, client=client)
                            resolved_results = await asyncio.gather(*[fetch_item(u) for u in unwrapped_urls], return_exceptions=True)
                            for idx, res in enumerate(resolved_results):
                                if not isinstance(res, Exception):
                                    resolved_buffers_data.append(res["data"])

                        if resolved_buffers_data:
                            stitched_bytes = await asyncio.to_thread(
                                img_utils.stitch_images_together, resolved_buffers_data, layout="vertical"
                            )
                            stitched_cache.set(cache_id, {"data": stitched_bytes, "content_type": "image/png"})
                            logger.info(f"[Cache Fallback] Successfully re-stitched and cached '{cache_id}' ({len(stitched_bytes)} bytes)")
                            return Response(
                                content=stitched_bytes,
                                media_type="image/png",
                                headers={"Cache-Control": "public, max-age=86400"}
                            )
        except Exception as se:
            logger.error(f"[Cache Fallback] Dynamic re-stitching failed for '{cache_id}': {se}", exc_info=True)

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
                edit_history.set(new_url, body.url)
                try:
                    import database.db as db
                    db.save_edit_history(new_url, body.url)
                except Exception:
                    pass
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
# ─── Layer Segmentation Route ──────────────────────────────────────────────────

@router.post("/process-layers/{panel_id}", summary="Separate image into background, character, and text layers")
async def extract_panel_layers(panel_id: str, body: ProcessLayersRequest):
    logger.info(f"[Layer Segmentation] Request received for panel_id {panel_id}, url: {body.url[:60]}...")
    tmp_in_path = None

    try:
        # Resolve image
        resolved = await img_utils.resolve_image_to_buffer(body.url)

        # Write to temp file
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_in_path = tmp_in.name

        try:
            # 1. Detect and slice panels from full manga page
            logger.info(f"[Layer Segmentation] Slicing page for panel_id {panel_id}...")
            detected_panels = run_cv_detection(
                image_path=tmp_in_path,
                sensitivity=30.0,
                bg_mode="auto",
                min_width_pct=0.15,
                min_height_px=60,
                merge_threshold=20,
                aspect_ratio_str="free",
                auto_split=True
            )
            
            img = Image.open(tmp_in_path)
            w, h = img.size
            
            # If no panels detected, fallback to the entire page as a single panel
            if not detected_panels:
                logger.info("[Layer Segmentation] No individual panels detected. Processing entire page as a single panel.")
                layers = await process_layers(tmp_in_path, panel_id)
                return {
                    "success": True,
                    "panel_id": panel_id,
                    "layers": layers,
                    "panels": [{
                        "panel_index": 0,
                        "box": {
                            "cropTop": 0.0,
                            "cropBottom": 0.0,
                            "cropLeft": 0.0,
                            "cropRight": 0.0,
                            "width": w,
                            "height": h,
                            "area": w * h
                        },
                        "layers": layers
                    }]
                }
                
            logger.info(f"[Layer Segmentation] Sliced manga page into {len(detected_panels)} panels — processing in parallel.")

            # Cap concurrency at 3 simultaneous panels (rembg U-2-Net is memory intensive)
            panel_semaphore = asyncio.Semaphore(3)

            async def process_one_panel(idx: int, box: dict):
                """Crop, segment, and clean up a single detected panel concurrently."""
                async with panel_semaphore:
                    top_px = int(round((box["cropTop"] / 100) * h))
                    bot_px = int(round((box["cropBottom"] / 100) * h))
                    left_px = int(round((box["cropLeft"] / 100) * w))
                    right_px = int(round((box["cropRight"] / 100) * w))

                    crop_w = w - left_px - right_px
                    crop_h = h - top_px - bot_px

                    if left_px < 0 or top_px < 0 or crop_w <= 0 or crop_h <= 0 or (left_px + crop_w) > w or (top_px + crop_h) > h:
                        logger.warning(
                            f"[Layer Segmentation] Panel {idx} has out-of-bounds crop box: "
                            f"left={left_px}, top={top_px}, w={crop_w}, h={crop_h} (image {w}x{h}) — skipping."
                        )
                        return None

                    if crop_w <= 10 or crop_h <= 10:
                        logger.warning(f"[Layer Segmentation] Panel {idx} is too small ({crop_w}x{crop_h}) — skipping.")
                        return None

                    img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))

                    tmp_panel_path = None
                    try:
                        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_panel:
                            img_cropped.save(tmp_panel, format="PNG")
                            tmp_panel_path = tmp_panel.name

                        logger.info(f"[Layer Segmentation] Processing panel {idx}/{len(detected_panels)-1} (panel_id={panel_id}_{idx})...")
                        panel_layers = await process_layers(tmp_panel_path, f"{panel_id}_{idx}")
                        return {
                            "panel_index": idx,
                            "box": box,
                            "layers": panel_layers
                        }
                    except Exception as panel_err:
                        logger.error(f"[Layer Segmentation] Panel {idx} failed: {panel_err}", exc_info=True)
                        return None
                    finally:
                        if tmp_panel_path and os.path.exists(tmp_panel_path):
                            try:
                                os.remove(tmp_panel_path)
                            except OSError:
                                pass

            # Run all panel tasks concurrently and collect results
            panel_tasks = [process_one_panel(idx, box) for idx, box in enumerate(detected_panels)]
            panel_results = await asyncio.gather(*panel_tasks)

            # Filter out None (skipped/failed panels) and sort by panel_index
            results = sorted(
                [r for r in panel_results if r is not None],
                key=lambda r: r["panel_index"]
            )

            first_layers = results[0]["layers"] if results else None

            # Trigger automatic training check
            try:
                from services.training_monitor import check_and_trigger_training
                await asyncio.to_thread(check_and_trigger_training)
            except Exception:
                pass

            return {
                "success": True,
                "panel_id": panel_id,
                "layers": first_layers,
                "panels": results
            }
        finally:
            if tmp_in_path and os.path.exists(tmp_in_path):
                try:
                    os.remove(tmp_in_path)
                except OSError:
                    pass


    except Exception as e:
        logger.error(
            f"[Layer Segmentation API Error] panel_id={panel_id} url={body.url[:80]} failed: {e}",
            exc_info=True
        )
        raise HTTPException(status_code=500, detail=f"Layer segmentation failed: {e}")

# ─── YOLO Debug Visualization ───────────────────────────────────────────────

@router.get("/debug-yolo", summary="Return panel image with YOLO speech-bubble detections drawn as overlays")
async def debug_yolo_detections(
    url: str,
    conf: float = 0.25
):
    """
    Runs the kitsumed YOLOv8m-seg model on the given panel image URL and returns
    a PNG with all detected speech bubbles highlighted (masks + bounding boxes + labels).

    Query params:
    - url  : absolute URL or /api/image/cached/<key> of the panel image
    - conf : confidence threshold (default 0.25)
    """
    logger.info(f"[Debug YOLO] Visualizing detections for url={url[:80]} conf={conf}")
    tmp_path = None
    try:
        # Resolve image to a local temp file
        resolved = await img_utils.resolve_image_to_buffer(url)
        suffix = ".png"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp_f:
            tmp_f.write(resolved["buffer"])
            tmp_path = tmp_f.name

        # Draw detections
        from media.image.debug_visualizer import draw_yolo_detections
        annotated_bytes = await asyncio.to_thread(draw_yolo_detections, tmp_path, conf)

        if annotated_bytes is None:
            raise HTTPException(status_code=503, detail="YOLO model is not available.")

        return Response(
            content=annotated_bytes,
            media_type="image/png",
            headers={"Cache-Control": "no-store"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Debug YOLO] Failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Debug YOLO failed: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass

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
            try:
                import database.db as db
                db.save_edit_history(new_url, body.url)
            except Exception:
                pass

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
                    try:
                        import database.db as db
                        db.save_edit_history(new_url, url)
                    except Exception:
                        pass

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


@router.get("/training-data-count", summary="Get the total count of training pairs in the local training_data folder")
async def get_training_data_count():
    try:
        training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
        if not os.path.exists(training_dir):
            return {"count": 0}
        files = os.listdir(training_dir)
        original_files = [f for f in files if f.startswith("original_")]
        return {"count": len(original_files)}
    except Exception as e:
        logger.error(f"Failed to get training data count: {e}", exc_info=True)
        return {"count": 0}


@router.get("/training-data-list", summary="List all training sample pairs saved locally")
async def get_training_data_list():
    try:
        training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
        if not os.path.exists(training_dir):
            return []
        files = os.listdir(training_dir)
        original_files = [f for f in files if f.startswith("original_")]
        
        pairs = []
        for orig in sorted(original_files):
            # Extract the unique pair ID, e.g. "original_abc123.png" -> "abc123"
            name_part, ext = os.path.splitext(orig)
            pair_id = name_part.replace("original_", "")
            
            # Find the corresponding mask file
            mask_filename = f"mask_{pair_id}{ext}"
            if not os.path.exists(os.path.join(training_dir, mask_filename)):
                found = glob.glob(os.path.join(training_dir, f"mask_{pair_id}.*"))
                if found:
                    mask_filename = os.path.basename(found[0])
                else:
                    mask_filename = None
                    
            if mask_filename:
                pairs.append({
                    "pair_id": pair_id,
                    "original_url": f"/api/image/training-data-file/{orig}",
                    "mask_url": f"/api/image/training-data-file/{mask_filename}"
                })
        return pairs
    except Exception as e:
        logger.error(f"Failed to list training data: {e}", exc_info=True)
        return []


@router.get("/training-data-file/{filename}", summary="Get a training file directly from training_data folder")
async def get_training_data_file(filename: str):
    from fastapi.responses import FileResponse
    training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
    file_path = os.path.join(training_dir, filename)
    if not os.path.abspath(file_path).startswith(training_dir):
        raise HTTPException(status_code=400, detail="Invalid path")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)




@router.post("/save-training-data", summary="Save human-corrected text masks and original panels for future training (Data Flywheel)")
async def save_training_data(
    original_panel: UploadFile = File(...),
    corrected_text_mask: UploadFile = File(...)
):
    logger.info(f"[Data Flywheel] Received human-corrected training sample pairs.")
    try:
        # Define local directory inside the container/sandbox
        training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
        os.makedirs(training_dir, exist_ok=True)

        unique_pair_id = uuid.uuid4().hex[:12]

        # Read files to bytes
        orig_bytes = await original_panel.read()
        mask_bytes = await corrected_text_mask.read()

        # Deduce file extensions or default to .webp
        orig_ext = mimetypes.guess_extension(original_panel.content_type or "") or ".webp"
        mask_ext = mimetypes.guess_extension(corrected_text_mask.content_type or "") or ".webp"

        orig_filename = f"original_{unique_pair_id}{orig_ext}"
        mask_filename = f"mask_{unique_pair_id}{mask_ext}"

        # Check environment
        env_mode = os.getenv("ENVIRONMENT", "development").lower().strip()
        
        orig_url = None
        mask_url = None

        if env_mode == "production":
            logger.info(f"[Data Flywheel] ENVIRONMENT=production — uploading training pair to Supabase.")
            try:
                # Upload using asyncio.to_thread since upload_to_supabase_bucket is synchronous
                orig_url = await asyncio.to_thread(
                    upload_to_supabase_bucket,
                    orig_bytes,
                    "panels",
                    f"training_data/{orig_filename}",
                    original_panel.content_type or "image/webp"
                )
                mask_url = await asyncio.to_thread(
                    upload_to_supabase_bucket,
                    mask_bytes,
                    "panels",
                    f"training_data/{mask_filename}",
                    corrected_text_mask.content_type or "image/webp"
                )
            except Exception as e:
                logger.error(f"[Data Flywheel] Supabase upload failed, falling back to local storage: {e}", exc_info=True)

        # Fallback to local storage if URLs are not populated (either dev mode or upload failed)
        if not orig_url or not mask_url:
            orig_dest = os.path.join(training_dir, orig_filename)
            mask_dest = os.path.join(training_dir, mask_filename)

            # Save files locally
            with open(orig_dest, "wb") as f_orig:
                f_orig.write(orig_bytes)

            with open(mask_dest, "wb") as f_mask:
                f_mask.write(mask_bytes)
            
            logger.info(f"[Data Flywheel] Successfully saved training pair locally inside {training_dir}")
            
            orig_url = f"/training_data/{orig_filename}"
            mask_url = f"/training_data/{mask_filename}"
        else:
            logger.info(f"[Data Flywheel] Successfully saved training pair in Supabase.")

        # Trigger an immediate check for automatic training
        try:
            from services.training_monitor import check_and_trigger_training
            await asyncio.to_thread(check_and_trigger_training)
        except Exception as monitor_err:
            logger.warning(f"[Data Flywheel] Failed to run automatic training check: {monitor_err}")

        return {
            "success": True,
            "message": "Successfully saved training pair.",
            "pair_id": unique_pair_id,
            "original_panel_url": orig_url,
            "corrected_text_mask_url": mask_url
        }
    except Exception as e:
        logger.error(f"[Data Flywheel] Failed to save training data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save training data: {e}")

# ─── YOLO Fine-Tuning Routes ────────────────────────────────────────────────

@router.post("/start-training", summary="Trigger YOLO fine-tuning on the collected training data")
async def start_training(epochs: int = 20, batch_size: int = 4):
    """
    Triggers the YOLO fine-tuning pipeline as a background thread.
    Returns 409 Conflict if training is already running.
    """
    from media.image.train_yolo import trigger_fine_tuning
    
    # Check if we have any training data to train on
    training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
    orig_files = glob.glob(os.path.join(training_dir, "original_*.*"))
    if len(orig_files) == 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot start training: No human-corrected samples have been saved to training_data/ yet. Use the brush to save corrections first."
        )

    success = trigger_fine_tuning(epochs, batch_size)
    if not success:
        raise HTTPException(status_code=409, detail="A training run is already in progress.")
    
    return {"success": True, "message": f"Training started in background for {epochs} epochs (batch={batch_size})."}


@router.delete("/training-data-pair/{pair_id}", summary="Delete a human-corrected training pair by ID")
async def delete_training_data_pair(pair_id: str):
    try:
        training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "training_data"))
        if not os.path.exists(training_dir):
            raise HTTPException(status_code=404, detail="Training directory does not exist")
        
        original_pattern = os.path.join(training_dir, f"original_{pair_id}.*")
        mask_pattern = os.path.join(training_dir, f"mask_{pair_id}.*")
        
        orig_matches = glob.glob(original_pattern)
        mask_matches = glob.glob(mask_pattern)
        
        deleted = False
        for f in orig_matches + mask_matches:
            if os.path.exists(f):
                os.remove(f)
                deleted = True
                
        if not deleted:
            raise HTTPException(status_code=404, detail=f"No files found for training pair ID {pair_id}")
            
        logger.info(f"[Data Flywheel] Successfully deleted training pair ID: {pair_id}")
        return {"success": True, "message": f"Successfully deleted training pair ID: {pair_id}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete training pair {pair_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/training-status", summary="Get status of current YOLO fine-tuning run")
async def get_training_status():
    """
    Returns real-time metrics, epoch progress, elapsed time, and auto-trigger stats.
    """
    from media.image.train_yolo import status, is_training_locked, get_lock_pid
    from services.training_monitor import get_current_original_count, load_metadata, TRAINING_DATA_DIR
    import os

    status_dict = status.to_dict()

    # 1. Fetch persistent metadata
    try:
        meta = load_metadata()
        last_trained_count = meta.get("last_trained_count", 0)
    except Exception:
        last_trained_count = 0

    # 2. Count current files
    try:
        current_count = get_current_original_count()
    except Exception:
        current_count = 0

    new_samples_count = max(0, current_count - last_trained_count)

    # 3. Lock file stats
    lock_file_path = os.path.join(TRAINING_DATA_DIR, "training.lock")
    lock_file_exists = os.path.exists(lock_file_path)
    lock_file_pid = get_lock_pid(lock_file_path) if lock_file_exists else None
    lock_file_active = is_training_locked(lock_file_path) if lock_file_exists else False

    # 4. Hardware status
    gpu_available = False
    try:
        import torch
        gpu_available = torch.cuda.is_available()
    except Exception:
        pass

    # Add extra fields to the status dictionary
    status_dict.update({
        "last_trained_count": last_trained_count,
        "current_count": current_count,
        "new_samples_count": new_samples_count,
        "auto_trigger_threshold": 20,
        "lock_file_exists": lock_file_exists,
        "lock_file_pid": lock_file_pid,
        "lock_file_active": lock_file_active,
        "gpu_available": gpu_available
    })

    return status_dict

