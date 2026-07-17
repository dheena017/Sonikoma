"""
backend/app/api/v1/images/transform.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for merging, splitting, compressing, and executing specific
pixel transformations (rotation, scaling, overlay text, composite, layer splits).
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import re
import asyncio
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Response, Path, Request
from pydantic import BaseModel, Field

from utils.cache import stitched_cache
from media.image.imagemagick_engine import ResizeMode, FilterType
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
            from database import db
            original_url = db.get_panel_original_url(cached_url_key)
        except Exception:
            pass

    # Fallback 3: SQLite edit_history table lookup
    if not original_url:
        try:
            from database import db
            hist = db.get_edit_history(cached_url_key)
            if hist and hist.get("original_url"):
                original_url = hist["original_url"]
        except Exception:
            pass

    # Fallback 4: Scraper session / Referer fallback (for guest sessions & legacy norm_ URLs)
    if not original_url:
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
                from database import db
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
            from database import db
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
