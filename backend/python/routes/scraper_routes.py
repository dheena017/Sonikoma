"""
backend/python/routes/scraper_routes.py
─────────────────────────────────────────────────────────────────────────────
Webtoon scraper and Storyboard generation routes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import asyncio
import time
import httpx
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Body, Request
from pydantic import BaseModel, Field
import os
import jwt
import database.db as db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "anivox_super_secret_key_change_me")
ALGORITHM = "HS256"

def get_optional_user_id(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.info("[Auth] No Authorization header or Bearer prefix found.")
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        logger.info(f"[Auth] Successfully decoded token for user_id: {user_id}")
        return user_id
    except Exception as e:
        logger.warning(f"[Auth] Failed to decode JWT token: {e}", exc_info=True)
        return None

import io
import tempfile
import random
from PIL import Image
from services.detect_panels import run_cv_detection
from utils.url_utils import extract_webtoon_url, parse_webtoon_url
from utils.id_utils import generate_project_id
from utils.cache import stitched_cache, edit_history
import utils.image_utils as img_utils
from config.clients import DYNAMIC_BACKGROUND_VIDEOS
from services.scraper import scrape_images_from_url, scraped_metadata_cache
from services.storyboard_ai import generate_dynamic_panels

logger = logging.getLogger("anivox.routes.scraper_routes")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ScrapeImagesRequest(BaseModel):
    url: str
    source: Optional[str] = None
    bypass_cache: Optional[bool] = True
    smart_slice: Optional[bool] = True # New option to return auto-cropped panels instead of a single strip
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None
    project_id: Optional[str] = None
    scrape_only: Optional[bool] = False

class GenerateStoryboardOnlyRequest(BaseModel):
    url: str
    project_id: str
    model: Optional[str] = "gemini-2.5-flash"
    narrationStyle: Optional[str] = "long"
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None

class GenerateStoryboardRequest(BaseModel):
    url: str
    episode_id: Optional[str] = None
    panels: Optional[List[Dict[str, Any]]] = None
    custom_background_video: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"
    bypass_cache: Optional[bool] = True
    narrationStyle: Optional[str] = "long"  # 'long' = detailed YouTube narration, 'short' = quick subtitles
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None

class ProcessUrlRequest(BaseModel):
    url: str

class SaveScrapedImagesRequest(BaseModel):
    url: str
    images: List[str]


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/scrape-images", summary="Scrape comic panels from Webtoon URL")
async def scrape_images(request: Request, body: ScrapeImagesRequest):
    try:
        user_id = get_optional_user_id(request)
        normalized_url = extract_webtoon_url(body.url)
        parsed = parse_webtoon_url(normalized_url)
        if body.title:
            parsed["title"] = body.title
        if body.episode:
            parsed["episode"] = body.episode
        if body.genre:
            parsed["genre"] = body.genre
        if body.author:
            parsed["author"] = body.author
        if body.cover_image:
            parsed["cover_image"] = body.cover_image
        if body.synopsis:
            parsed["synopsis"] = body.synopsis
        
        logger.info(f"[Scraper] Scrape request received - source: {body.source or 'unknown'}, url: {normalized_url}")
        
        proxied_urls = await scrape_images_from_url(normalized_url, body.source, bypass_cache=body.bypass_cache)
        
        # Merge scraped metadata into parsed dictionary
        metadata = scraped_metadata_cache.get(normalized_url, {})
        if metadata:
            if not body.title and metadata.get("title"):
                parsed["title"] = metadata["title"]
            if not body.genre and metadata.get("genre"):
                parsed["genre"] = metadata["genre"]
            if not body.author and metadata.get("author"):
                parsed["author"] = metadata["author"]
            if not body.cover_image and metadata.get("cover_image"):
                parsed["cover_image"] = metadata["cover_image"]
            if not body.synopsis and (metadata.get("description") or metadata.get("synopsis")):
                parsed["synopsis"] = metadata.get("description") or metadata.get("synopsis")

        logger.info(f"[Scraper] Successfully extracted {len(proxied_urls)} raw image URLs.")

        final_images = proxied_urls
        cache_hit = False

        # ── Width-normalisation pass (scrape_only / Separate Panel Images mode) ──
        # Resize every image to the same width as the first image, preserving
        # each image's own height proportionally, so all panels render at the
        # same width in the storyboard grid.
        if getattr(body, "scrape_only", False) and len(proxied_urls) > 1:
            try:
                logger.info(f"[Scraper] Starting width-normalisation for {len(proxied_urls)} images...")
                t_norm_start = time.time()

                async with httpx.AsyncClient(follow_redirects=True, timeout=60.0,
                                              limits=httpx.Limits(max_connections=30)) as client:
                    sem = asyncio.Semaphore(10)

                    async def fetch_norm(url):
                        async with sem:
                            return await img_utils.resolve_image_to_buffer(url, client=client)

                    results = await asyncio.gather(
                        *[fetch_norm(u) for u in proxied_urls],
                        return_exceptions=True
                    )

                # Determine canonical width from first successfully fetched image
                canonical_w = None
                for res in results:
                    if not isinstance(res, Exception):
                        try:
                            img_probe = Image.open(io.BytesIO(res["data"]))
                            canonical_w = img_probe.size[0]
                            break
                        except Exception:
                            continue

                if canonical_w:
                    normalised_urls = []
                    for idx, (url, res) in enumerate(zip(proxied_urls, results)):
                        if isinstance(res, Exception):
                            normalised_urls.append(url)
                            continue
                        try:
                            img = Image.open(io.BytesIO(res["data"]))
                            w, h = img.size
                            if w != canonical_w:
                                new_h = max(1, int(round(h * (canonical_w / w))))
                                img = img.resize((canonical_w, new_h), Image.Resampling.LANCZOS)
                            out = io.BytesIO()
                            fmt = img.format or "JPEG"
                            if img.mode == "RGBA" and fmt == "JPEG":
                                img = img.convert("RGB")
                            img.save(out, format=fmt, quality=90)
                            img_bytes = out.getvalue()

                            uid = f"norm_{int(time.time() * 1000)}_{idx}_{random.randint(0, 9999)}"
                            cached_url = f"/api/merge-images/cached/{uid}"
                            stitched_cache.set(uid, {"data": img_bytes, "content_type": res.get("contentType", "image/jpeg")})
                            edit_history.set(cached_url, url)
                            normalised_urls.append(cached_url)
                        except Exception as norm_err:
                            logger.warning(f"[Scraper] Width-norm failed for image {idx}: {norm_err}")
                            normalised_urls.append(url)

                    final_images = normalised_urls
                    elapsed = round((time.time() - t_norm_start) * 1000, 2)
                    logger.info(f"[Scraper] Width-normalisation done in {elapsed}ms. Canonical width: {canonical_w}px")
                else:
                    logger.warning("[Scraper] Could not determine canonical width — skipping normalisation")
            except Exception as norm_ex:
                logger.warning(f"[Scraper] Width-normalisation pass failed: {norm_ex}")


        if not getattr(body, "scrape_only", False):
            # Check cache for an existing stitched strip for this exact URL
            cache_key = f"stitched_full_{normalized_url}"
            if not body.bypass_cache:
                cached_url = stitched_cache.get(cache_key)
                if cached_url and isinstance(cached_url, str):
                    logger.info(f"[Scraper] Cache HIT: Returning existing stitched strip for {normalized_url}")
                    final_images = [cached_url]
                    cache_hit = True

            # Fetch image buffers in parallel if not a cache hit and we need layout processing (stitch or smart_slice)
            resolved_buffers_data = []
            if not cache_hit and len(proxied_urls) > 0:
                logger.info(f"[Scraper] Fetching {len(proxied_urls)} image buffers in parallel for layout processing...")
                t_fetch_start = time.time()
                try:
                    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0, limits=httpx.Limits(max_connections=50)) as client:
                        sem = asyncio.Semaphore(15)
                        
                        async def fetch_with_sem(url):
                            async with sem:
                                return await img_utils.resolve_image_to_buffer(url, client=client)
                                
                        fetch_tasks = [fetch_with_sem(url) for url in proxied_urls]
                        resolved_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

                    for idx, res in enumerate(resolved_results):
                        if isinstance(res, Exception):
                            logger.warning(f"[Scraper] Failed to resolve image {idx}: {res}")
                            continue
                        resolved_buffers_data.append({
                            "url": proxied_urls[idx],
                            "data": res["data"],
                            "content_type": res["contentType"]
                        })
                    logger.info(f"[Scraper] Parallel fetch completed in {round((time.time() - t_fetch_start)*1000, 2)}ms. Fetched {len(resolved_buffers_data)} of {len(proxied_urls)} images.")
                except Exception as fetch_err:
                    logger.error(f"[Scraper] Failed to download images in parallel: {fetch_err}")

            # Automatically stitch multiple images into a single full strip if not a cache hit
            if not cache_hit and len(resolved_buffers_data) > 1 and not body.smart_slice:
                logger.info(f"[Scraper] Consolidating {len(resolved_buffers_data)} panels into a single unified strip asset...")
                t_stitch_start = time.time()
                try:
                    stitched_bytes = await asyncio.to_thread(
                        img_utils.stitch_images_together,
                        image_buffers=[item["data"] for item in resolved_buffers_data],
                        layout="vertical",
                        spacing=0,
                        spacing_color="white",
                        scale_to_fit=True,
                        align_mode="center",
                        padding=0
                    )

                    # Cache the result
                    unique_id = f"stitched_{int(time.time() * 1000)}_full"
                    stitched_url = f"/api/merge-images/cached/{unique_id}"

                    stitched_cache.set(unique_id, {"data": stitched_bytes, "content_type": "image/png"})
                    stitched_cache.set(cache_key, stitched_url)
                    edit_history.set(stitched_url, proxied_urls[0])

                    final_images = [stitched_url]
                    elapsed = round((time.time() - t_stitch_start) * 1000, 2)
                    logger.info(f"[Scraper] Consolidated strip created successfully in {elapsed}ms: {stitched_url}")
                except Exception as stitch_err:
                    logger.warning(f"[Scraper] Automatic stitching failed, falling back to separate images: {stitch_err}")
                    final_images = proxied_urls

            # Automatically run smart slice (panel slicing/detection) on separate vertical strip images if smart_slice is active
            elif not cache_hit and body.smart_slice and len(resolved_buffers_data) > 0:
                logger.info(f"[Scraper] Slicing/cropping comic images into panels...")
                t_slice_start = time.time()
                final_images = []
                
                for idx, item in enumerate(resolved_buffers_data):
                    img_url = item["url"]
                    image_buffer = item["data"]
                    content_type = item["content_type"]
                    
                    try:
                        img = Image.open(io.BytesIO(image_buffer))
                        w, h = img.size
                        
                        # Only slice if it's a vertical strip (height/width > 1.2)
                        if h / w > 1.2:
                            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                                tmp_in.write(image_buffer)
                                temp_in_path = tmp_in.name
                                
                            try:
                                # Run local CV panel detection with defaults
                                coord_panels = await asyncio.to_thread(
                                    run_cv_detection,
                                    image_path=temp_in_path,
                                    sensitivity=30.0,
                                    bg_mode="auto",
                                    min_width_pct=0.15,
                                    min_height_px=60,
                                    merge_threshold=20,
                                    aspect_ratio_str="free",
                                    canny_low=20,
                                    canny_high=100,
                                    close_kernel_size=15,
                                    auto_split=True
                                )
                            finally:
                                if os.path.exists(temp_in_path):
                                    os.remove(temp_in_path)
                                    
                            if coord_panels and len(coord_panels) > 1:
                                logger.info(f"[Scraper] Slicing strip {idx + 1} into {len(coord_panels)} panels")
                                for p_idx, box in enumerate(coord_panels):
                                    p_top = max(0.0, min(100.0, float(box.get("cropTop", 0))))
                                    p_bottom = max(0.0, min(100.0, float(box.get("cropBottom", 0))))
                                    p_left = max(0.0, min(100.0, float(box.get("cropLeft", 0))))
                                    p_right = max(0.0, min(100.0, float(box.get("cropRight", 0))))

                                    top_px = int(round((p_top / 100.0) * h))
                                    bot_px = int(round((p_bottom / 100.0) * h))
                                    left_px = int(round((p_left / 100.0) * w))
                                    right_px = int(round((p_right / 100.0) * w))

                                    crop_w = w - left_px - right_px
                                    crop_h = h - top_px - bot_px
                                    
                                    if crop_w > 10 and crop_h > 10:
                                        cropped_img = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                                        out = io.BytesIO()
                                        save_format = img.format or "JPEG"
                                        cropped_img.save(out, format=save_format)
                                        cropped_buffer = out.getvalue()
                                        
                                        unique_id = f"merged_{int(time.time() * 1000)}_smartcrop_{idx}_{p_idx}_{random.randint(0, 1000)}"
                                        cached_url = f"/api/merge-images/cached/{unique_id}"
                                        
                                        stitched_cache.set(unique_id, {"data": cropped_buffer, "content_type": content_type})
                                        edit_history.set(cached_url, img_url)
                                        final_images.append(cached_url)
                            else:
                                final_images.append(img_url)
                        else:
                            final_images.append(img_url)
                    except Exception as slice_err:
                        logger.warning(f"[Scraper] Failed to slice image {idx}: {slice_err}")
                        final_images.append(img_url)
                        
                elapsed = round((time.time() - t_slice_start) * 1000, 2)
                logger.info(f"[Scraper] Auto-sliced panels generated successfully in {elapsed}ms. Total sliced: {len(final_images)} panels from {len(resolved_buffers_data)} strips.")

        # Automatically generate project details in SQLite if authenticated (0 panels, project entry only)
        project_id = body.project_id or generate_project_id()

        # Persist scrape session images in SQLite cache
        if final_images and not project_id.startswith("temp_"):
            try:
                db.save_scrape_session(normalized_url, final_images)
            except Exception as se_err:
                logger.warning(f"[Scraper] Failed to automatically save scrape session: {se_err}")

        # Do not automatically insert project row into DB during scrape anymore.
        # Projects will be created in the database when the user clicks 'Save Changes' in the UI.

        return_panels = []

        # Build a map of final_image_url → original_source_url for recovery
        # This lets the frontend persist original_url on each panel in the DB
        image_origins: dict = {}
        for final_url in final_images:
            origin = edit_history.get(final_url)
            if origin:
                image_origins[final_url] = origin
            elif final_url in proxied_urls:
                image_origins[final_url] = final_url

        # If project already exists, fetch its slugs
        existing_project = db.get_project(project_id) if project_id and not project_id.startswith("temp_") else None
        series_slug = existing_project.get("series_slug") if existing_project else None
        chapter_slug = existing_project.get("chapter_slug") if existing_project else None

        return {
            "success": True,
            "project_id": project_id,
            "series_slug": series_slug,
            "chapter_slug": chapter_slug,
            "title": parsed.get("title"),
            "genre": parsed.get("genre"),
            "episode": parsed.get("episode"),
            "author": parsed.get("author"),
            "cover_image": parsed.get("cover_image"),
            "synopsis": parsed.get("synopsis"),
            "total_images": len(final_images),
            "images": final_images,
            "raw_images": proxied_urls,
            "image_origins": image_origins,
            "panels": return_panels,
            "debug": {
                "normalized_url": normalized_url,
                "source": body.source,
                "original_count": len(proxied_urls),
                "smart_slice": body.smart_slice,
                "cache": "HIT" if cache_hit else "MISS"
            }
        }
    except Exception as e:
        logger.error(f"[Scraper Error] Failed to extract page assets: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={
            "success": False,
            "message": str(e) or "Failed to parse page images.",
            "error": str(e),
            "source": body.source,
            "request_url": body.url,
            "images": []
        })


@router.post("/generate", summary="Generate storyboard storyboard and narrative scripts")
async def generate_storyboard(request: Request, body: GenerateStoryboardRequest):
    try:
        parsed = parse_webtoon_url(body.url)
        if body.title:
            parsed["title"] = body.title
        if body.episode:
            parsed["episode"] = body.episode
        if body.genre:
            parsed["genre"] = body.genre
        if body.author:
            parsed["author"] = body.author
        if body.cover_image:
            parsed["cover_image"] = body.cover_image
        if body.synopsis:
            parsed["synopsis"] = body.synopsis
        project_id = body.episode_id or generate_project_id()
        
        logger.info(f"[Model] Processing storyboard request for url: \"{body.url}\". Parsed Title: \"{parsed['title']}\", Genre: \"{parsed['genre']}\"")

        # Select background video based on genre
        logger.info(f"[Model] Selecting background video for genre: {parsed['genre']}")
        video_url = DYNAMIC_BACKGROUND_VIDEOS["general"]
        genre_lower = parsed["genre"].lower()
        
        if body.custom_background_video:
            video_url = body.custom_background_video
        elif any(x in genre_lower for x in ['action', 'martial', 'hero', 'solo']):
            video_url = DYNAMIC_BACKGROUND_VIDEOS["action"]
        elif any(x in genre_lower for x in ['romance', 'love', 'slice', 'drama', 'olympus']):
            video_url = DYNAMIC_BACKGROUND_VIDEOS["romance"]
        elif any(x in genre_lower for x in ['fantasy', 'magic', 'tower', 'god']):
            video_url = DYNAMIC_BACKGROUND_VIDEOS["fantasy"]
        elif any(x in genre_lower for x in ['cyber', 'sci', 'thriller', 'tech']):
            video_url = DYNAMIC_BACKGROUND_VIDEOS["cyberpunk"]

        scraped_urls = await scrape_images_from_url(body.url, bypass_cache=body.bypass_cache)

        user_id = get_optional_user_id(request)

        # Re-use client panels if provided
        if body.panels and len(body.panels) > 0:
            logger.info("[Model] Utilizing client-provided storyboard modifications directly. Resolving placeholders.")
            resolved_panels = []
            for idx, p in enumerate(body.panels):
                resolved_img = p.get("image_url")
                if not resolved_img or "data:image/svg" in resolved_img or "Awaiting Source" in resolved_img:
                    if scraped_urls:
                        resolved_img = scraped_urls[idx % len(scraped_urls)]
                
                # Clone and set image_url
                p_copy = dict(p)
                p_copy["image_url"] = resolved_img
                resolved_panels.append(p_copy)

            logger.info(f"[Model] Resolved {len(resolved_panels)} panels with client-provided data.")
            
            if user_id and not project_id.startswith("temp_"):
                try:
                    db.insert_project({
                        "project_id": project_id,
                        "url": body.url,
                        "title": parsed["title"],
                        "genre": parsed["genre"],
                        "episode": parsed["episode"],
                        "author": parsed.get("author"),
                        "cover_image": parsed.get("cover_image"),
                        "synopsis": parsed.get("synopsis"),
                        "status": "pending",
                        "panels_count": len(resolved_panels),
                        "video_url": None,
                        "user_id": user_id
                    })
                    db.insert_panels(project_id, [{
                        "image_url": p.get("image_url") or "",
                        "original_url": p.get("original_image_url") or p.get("original_url"),
                        "speech_text": p.get("speech_text") or "",
                        "sfx": p.get("sfx") or "",
                        "duration": p.get("duration") if p.get("duration") is not None else 4.5,
                        "motion_type": p.get("motion_type") or "zoom_in",
                        "visual_description": p.get("visual_description"),
                        "brightness": p.get("brightness"),
                        "contrast": p.get("contrast"),
                        "saturation": p.get("saturation"),
                        "grayscale": p.get("grayscale", False),
                        "filter_preset": p.get("filter_preset"),
                        "bubble_method": p.get("bubble_method"),
                        "bubble_sensitivity": p.get("bubble_sensitivity"),
                        "bubble_dilation": p.get("bubble_dilation"),
                        "inpaint_radius": p.get("inpaint_radius"),
                        "detection_style": p.get("detection_style")
                    } for p in resolved_panels])
                    logger.info(f"[Database] Automatically saved client-provided storyboard for project {project_id} and user {user_id}")
                except Exception as db_err:
                    logger.error(f"[Database] Failed to automatically save client panels: {db_err}", exc_info=True)

            return {
                "project_id": project_id,
                "status": "success",
                "video_url": video_url,
                "panels_processed": len(resolved_panels),
                "message": "Webtoon storyboard adjusted and resolved successfully.",
                "panels": resolved_panels
            }

        # Generate panels using AI
        logger.info(f"[Model] Dispatching panels generation via AI model: {body.model} (narrationStyle={body.narrationStyle})...")
        response_panels = await generate_dynamic_panels(
            parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, body.model,
            narration_style=body.narrationStyle or "long"
        )
        logger.info(f"[Model] Successfully generated {len(response_panels)} storyboard panels.")

        if not response_panels:
            raise ValueError("Model failed to generate valid storyboard panels.")

        if user_id and not project_id.startswith("temp_"):
            try:
                db.insert_project({
                    "project_id": project_id,
                    "url": body.url,
                    "title": parsed["title"],
                    "genre": parsed["genre"],
                    "episode": parsed["episode"],
                    "author": parsed.get("author"),
                    "cover_image": parsed.get("cover_image"),
                    "synopsis": parsed.get("synopsis"),
                    "status": "pending",
                    "panels_count": len(response_panels),
                    "video_url": None,
                    "user_id": user_id
                })
                db.insert_panels(project_id, [{
                    "image_url": p.get("image_url") or "",
                    "original_url": p.get("original_image_url") or p.get("original_url"),
                    "speech_text": p.get("speech_text") or "",
                    "sfx": p.get("sfx") or "",
                    "duration": p.get("duration") if p.get("duration") is not None else 4.5,
                    "motion_type": p.get("motion_type") or "zoom_in",
                    "visual_description": p.get("visual_description"),
                    "brightness": p.get("brightness"),
                    "contrast": p.get("contrast"),
                    "saturation": p.get("saturation"),
                    "grayscale": p.get("grayscale", False),
                    "filter_preset": p.get("filter_preset"),
                    "bubble_method": p.get("bubble_method"),
                    "bubble_sensitivity": p.get("bubble_sensitivity"),
                    "bubble_dilation": p.get("bubble_dilation"),
                    "inpaint_radius": p.get("inpaint_radius"),
                    "detection_style": p.get("detection_style")
                } for p in response_panels])
                logger.info(f"[Database] Automatically saved AI-generated storyboard for project {project_id} and user {user_id}")
            except Exception as db_err:
                logger.error(f"[Database] Failed to automatically save AI storyboard: {db_err}", exc_info=True)

        from skills.registry import registry
        storyboard_skill = registry.get("storyboard_narrative")
        input_tokens = getattr(storyboard_skill, 'last_input_tokens', 0)
        output_tokens = getattr(storyboard_skill, 'last_output_tokens', 0)

        return {
            "project_id": project_id,
            "status": "success",
            "video_url": video_url,
            "panels_processed": len(response_panels),
            "message": f"Webtoon {parsed['title']} animation compilation created dynamically.",
            "panels": response_panels,
            "inputTokens": input_tokens,
            "outputTokens": output_tokens
        }
    except Exception as e:
        logger.error(f"[API Generate Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-storyboard", summary="Generate storyboard and narrative scripts only (no video compilation)")
async def generate_storyboard_only(request: Request, body: GenerateStoryboardOnlyRequest):
    try:
        parsed = parse_webtoon_url(body.url)
        if body.title:
            parsed["title"] = body.title
        if body.episode:
            parsed["episode"] = body.episode
        if body.genre:
            parsed["genre"] = body.genre
        if body.author:
            parsed["author"] = body.author
        if body.cover_image:
            parsed["cover_image"] = body.cover_image
        if body.synopsis:
            parsed["synopsis"] = body.synopsis
        
        project_id = body.project_id
        logger.info(f"[Model] Generating storyboard only for url: \"{body.url}\", project: {project_id}")

        # Fetch scraped images from cache/session
        scraped_urls = await scrape_images_from_url(body.url, bypass_cache=False)
        if not scraped_urls:
            # Try to get from db
            session = db.get_latest_scrape_session(body.url)
            if session and session.get("image_urls"):
                try:
                    scraped_urls = session["image_urls"]
                except:
                    scraped_urls = []

        if not scraped_urls:
            raise HTTPException(status_code=400, detail="No scraped images found for this URL. Please scrape assets first.")

        user_id = get_optional_user_id(request)

        # Generate panels using AI
        logger.info(f"[Model] Dispatching panels generation via AI model: {body.model}...")
        response_panels = await generate_dynamic_panels(
            parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, body.model,
            narration_style=body.narrationStyle or "long"
        )
        logger.info(f"[Model] Successfully generated {len(response_panels)} storyboard panels.")

        if not response_panels:
            raise ValueError("Model failed to generate valid storyboard panels.")

        # Re-map so they contain required keys
        final_panels = []
        for idx, p in enumerate(response_panels):
            final_panels.append({
                "id": p.get("id") or (idx + 1),
                "project_id": project_id,
                "panel_index": idx,
                "image_url": p.get("image_url") or "",
                "original_url": p.get("original_image_url") or p.get("original_url") or p.get("image_url") or "",
                "speech_text": p.get("speech_text") or "",
                "sfx": p.get("sfx") or "",
                "duration": p.get("duration") if p.get("duration") is not None else 4.5,
                "motion_type": p.get("motion_type") or "zoom_in",
                "grayscale": p.get("grayscale", False)
            })

        if user_id and not project_id.startswith("temp_"):
            try:
                db.insert_project({
                    "project_id": project_id,
                    "url": body.url,
                    "title": parsed["title"],
                    "genre": parsed["genre"],
                    "episode": parsed["episode"],
                    "author": parsed.get("author"),
                    "cover_image": parsed.get("cover_image"),
                    "synopsis": parsed.get("synopsis"),
                    "status": "pending",
                    "panels_count": len(final_panels),
                    "video_url": None,
                    "user_id": user_id
                })
                db.insert_panels(project_id, [{
                    "image_url": p["image_url"],
                    "original_url": p["original_url"],
                    "speech_text": p["speech_text"],
                    "sfx": p["sfx"],
                    "duration": p["duration"],
                    "motion_type": p["motion_type"],
                    "visual_description": p.get("visual_description"),
                    "brightness": p.get("brightness"),
                    "contrast": p.get("contrast"),
                    "saturation": p.get("saturation"),
                    "grayscale": p["grayscale"],
                    "filter_preset": p.get("filter_preset"),
                    "bubble_method": p.get("bubble_method"),
                    "bubble_sensitivity": p.get("bubble_sensitivity"),
                    "bubble_dilation": p.get("bubble_dilation"),
                    "inpaint_radius": p.get("inpaint_radius"),
                    "detection_style": p.get("detection_style")
                } for p in final_panels])
                logger.info(f"[Database] Automatically saved AI-generated storyboard for project {project_id}")
            except Exception as db_err:
                logger.error(f"[Database] Failed to automatically save AI storyboard: {db_err}", exc_info=True)

        return {
            "success": True,
            "project_id": project_id,
            "panels": final_panels
        }
    except Exception as e:
        logger.error(f"[API Generate Storyboard Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-url", summary="Legacy backward-compatibility endpoint")
async def process_url(body: ProcessUrlRequest):
    return {
        "status": "success",
        "message": "Url processed successfully",
        "payload": {
            "url": body.url,
            "title": "Processed Episode",
            "panels_found": 5
        }
    }

@router.put("/save-scraped-images", summary="Update/persist edited scraped images cache list in database")
async def save_scraped_images(body: SaveScrapedImagesRequest):
    try:
        normalized_url = extract_webtoon_url(body.url)
        db.save_scrape_session(normalized_url, body.images)
        logger.info(f"[Scraper] Successfully updated scrape session cache for {normalized_url} with {len(body.images)} images")
        return {"success": True, "message": "Scraped images updated successfully."}
    except Exception as e:
        logger.error(f"[Scraper] Failed to save scraped images cache: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
