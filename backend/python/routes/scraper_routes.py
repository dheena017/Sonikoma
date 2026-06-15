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
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field

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

class GenerateStoryboardRequest(BaseModel):
    url: str
    episode_id: Optional[str] = None
    panels: Optional[List[Dict[str, Any]]] = None
    custom_background_video: Optional[str] = None
    model: Optional[str] = "gemini-2.5-flash"
    bypass_cache: Optional[bool] = True

class ProcessUrlRequest(BaseModel):
    url: str


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/scrape-images", summary="Scrape comic panels from Webtoon URL")
async def scrape_images(body: ScrapeImagesRequest):
    try:
        normalized_url = extract_webtoon_url(body.url)
        parsed = parse_webtoon_url(normalized_url)
        
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
async def generate_storyboard(body: GenerateStoryboardRequest):
    try:
        parsed = parse_webtoon_url(body.url)
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
            return {
                "project_id": project_id,
                "status": "success",
                "video_url": video_url,
                "panels_processed": len(resolved_panels),
                "message": "Webtoon storyboard adjusted and resolved successfully.",
                "panels": resolved_panels
            }

        # Generate panels using AI
        response_panels = []
        try:
            logger.info(f"[Model] Dispatching panels generation via AI model: {body.model}...")
            response_panels = await generate_dynamic_panels(
                parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, body.model
            )
            logger.info(f"[Model] Successfully generated {len(response_panels)} storyboard panels.")
        except Exception as e:
            logger.warning(f"[Model] Dynamic panels generation helper failed, using fallback: {e}")

        # Programmatic placeholder fallback if AI returns empty
        if not response_panels:
            logger.info("[Model] Compiling storyboard with fully programmatic metadata extraction...")
            num_panels = min(len(scraped_urls), 5)
            placeholders = [
                {"speech_text": f"The saga of {parsed['title']} begins! Welcome to this breathtaking adventure.", "sfx": "[Echoing Footsteps]", "motion": "zoom_in"},
                {"speech_text": f"Each path unfurls dangerous secrets hidden within the {parsed['genre']} realm.", "sfx": "[Mystical Whispers]", "motion": "pan_right"},
                {"speech_text": f"Tension rises as rivals and allies cross paths silently in {parsed['episode']}.", "sfx": "[Drums Swell]", "motion": "zoom_out"},
                {"speech_text": f"An overwhelming power is unlocked, casting light across the battlefield!", "sfx": "[Energy Burst]", "motion": "pan_up"},
                {"speech_text": f"Thus the chapter rests. Stay tuned for the ultimate epic resolution!", "sfx": "[Flute Melancholy]", "motion": "zoom_in"}
            ]

            response_panels = []
            for idx in range(num_panels):
                p = placeholders[idx % len(placeholders)]
                img_url = scraped_urls[idx] if scraped_urls else f"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='100%' height='100%' fill='%230f0f11'/><text x='50%' y='50%' fill='%233f3f46' font-weight='bold' font-size='20' text-anchor='middle'>Frame Awaiting Source</text></svg>"
                
                response_panels.append({
                    "id": idx + 1,
                    "speech_text": p["speech_text"],
                    "sfx": p["sfx"],
                    "duration": 4.5,
                    "motion_type": p["motion"],
                    "image_url": img_url
                })

        return {
            "project_id": project_id,
            "status": "success",
            "video_url": video_url,
            "panels_processed": len(response_panels),
            "message": f"Webtoon {parsed['title']} animation compilation created dynamically.",
            "panels": response_panels
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
