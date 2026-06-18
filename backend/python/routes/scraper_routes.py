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

from utils.url_utils import extract_webtoon_url, parse_webtoon_url
from utils.id_utils import generate_project_id
from utils.cache import stitched_cache, edit_history
import utils.image_utils as img_utils
from config.clients import DYNAMIC_BACKGROUND_VIDEOS
from services.scraper import scrape_images_from_url
from services.storyboard_ai import generate_dynamic_panels

logger = logging.getLogger("anivox.routes.scraper_routes")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ScrapeImagesRequest(BaseModel):
    url: str
    source: Optional[str] = None
    bypass_cache: Optional[bool] = True
    smart_slice: Optional[bool] = False # New option to return auto-cropped panels instead of a single strip
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


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/scrape-images", summary="Scrape comic panels from Webtoon URL")
async def scrape_images(body: ScrapeImagesRequest):
    try:
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
        logger.info(f"[Scraper] Successfully extracted {len(proxied_urls)} raw image URLs.")

        final_images = proxied_urls

        # Check cache for an existing stitched strip for this exact URL
        cache_key = f"stitched_full_{normalized_url}"
        if not body.bypass_cache:
            cached_url = stitched_cache.get(cache_key)
            if cached_url and isinstance(cached_url, str):
                logger.info(f"[Scraper] Cache HIT: Returning existing stitched strip for {normalized_url}")
                return {
                    "success": True,
                    "title": parsed["title"],
                    "genre": parsed["genre"],
                    "episode": parsed["episode"],
                    "total_images": 1,
                    "images": [cached_url],
                    "raw_images": proxied_urls,
                    "panels": [],
                    "debug": {
                        "normalized_url": normalized_url,
                        "source": body.source,
                        "cache": "HIT"
                    }
                }

        # Automatically stitch multiple images into a single full strip
        if len(proxied_urls) > 1 and not body.smart_slice:
            logger.info(f"[Scraper] Consolidating {len(proxied_urls)} panels into a single unified strip asset...")
            t_stitch_start = time.time()
            try:
                # 1. Resolve all images to buffers in parallel for speed
                logger.info(f"[Scraper] Fetching {len(proxied_urls)} image buffers in parallel using shared HTTP client...")

                async with httpx.AsyncClient(follow_redirects=True, timeout=60.0, limits=httpx.Limits(max_connections=100)) as client:
                    fetch_tasks = [img_utils.resolve_image_to_buffer(url, client=client) for url in proxied_urls]
                    resolved_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)

                resolved_buffers = []
                for idx, res in enumerate(resolved_results):
                    if isinstance(res, Exception):
                        logger.warning(f"[Scraper] Failed to resolve image {idx}: {res}")
                        continue
                    resolved_buffers.append(res["data"])

                if not resolved_buffers:
                    raise ValueError("Failed to resolve any image buffers for stitching")

                # 2. Stitch them together
                stitched_bytes = await asyncio.to_thread(
                    img_utils.stitch_images_together,
                    image_buffers=resolved_buffers,
                    layout="vertical",
                    spacing=0,
                    spacing_color="white",
                    scale_to_fit=True,
                    align_mode="center",
                    padding=0
                )

                # 3. Cache the result
                unique_id = f"stitched_{int(time.time() * 1000)}_full"
                # Use /api/merge-images/cached/ to match image_routes.py and avoid 404s
                stitched_url = f"/api/merge-images/cached/{unique_id}"

                stitched_cache.set(unique_id, {"data": stitched_bytes, "content_type": "image/png"})
                # Cache the mapping from the normalized URL to the cached asset URL
                stitched_cache.set(cache_key, stitched_url)
                edit_history.set(stitched_url, proxied_urls[0])

                final_images = [stitched_url]
                elapsed = round((time.time() - t_stitch_start) * 1000, 2)
                logger.info(f"[Scraper] Consolidated strip created successfully in {elapsed}ms: {stitched_url}")
            except Exception as stitch_err:
                logger.warning(f"[Scraper] Automatic stitching failed, falling back to separate images: {stitch_err}")

        return {
            "success": True,
            "title": parsed["title"],
            "genre": parsed["genre"],
            "episode": parsed["episode"],
            "total_images": len(final_images),
            "images": final_images,
            "raw_images": proxied_urls,
            "panels": [],
            "debug": {
                "normalized_url": normalized_url,
                "source": body.source,
                "original_count": len(proxied_urls),
                "smart_slice": body.smart_slice
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
            
            if user_id:
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

        if user_id:
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
