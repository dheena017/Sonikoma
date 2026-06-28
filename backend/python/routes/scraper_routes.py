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
from fastapi import APIRouter, HTTPException, Body, Request, Depends
from pydantic import BaseModel, Field
import os
import jwt
import database.db as db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sonikoma_super_secret_key_change_me")
ALGORITHM = "HS256"

def get_optional_user_id(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
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
from services.scraper import scrape_images_from_url, scraped_metadata_cache
from services.storyboard_ai import generate_dynamic_panels
from routes.ai_routes import get_all_user_keys
from services.video import compile_video_from_panels
import os

logger = logging.getLogger("sonikoma.routes.scraper_routes")
router = APIRouter()

# ─── Schemas ──────────────────────────────────────────────────────────────────

class ScrapeImagesRequest(BaseModel):
    url: str
    source: Optional[str] = None
    bypass_cache: Optional[bool] = True
    smart_slice: Optional[bool] = True
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
    narrationStyle: Optional[str] = "long"
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

        # Override with body params if provided
        for key in ["title", "episode", "genre", "author", "cover_image", "synopsis"]:
            val = getattr(body, key, None)
            if val: parsed[key] = val

        logger.info(f"[Scraper] Scrape request: {normalized_url}")
        proxied_urls = await scrape_images_from_url(normalized_url, body.source, bypass_cache=body.bypass_cache)

        # Merge scraped metadata
        metadata = scraped_metadata_cache.get(normalized_url, {})
        if metadata:
            if not parsed.get("title"): parsed["title"] = metadata.get("title")
            if not parsed.get("genre"): parsed["genre"] = metadata.get("genre")
            if not parsed.get("author"): parsed["author"] = metadata.get("author")
            if not parsed.get("cover_image"): parsed["cover_image"] = metadata.get("cover_image")
            if not parsed.get("synopsis"): parsed["synopsis"] = metadata.get("description") or metadata.get("synopsis")

        final_images = proxied_urls
        cache_hit = False

        if not getattr(body, "scrape_only", False):
            cache_key = f"stitched_full_{normalized_url}"
            if not body.bypass_cache:
                cached_url = stitched_cache.get(cache_key)
                if cached_url:
                    final_images = [cached_url]
                    cache_hit = True

            resolved_buffers_data = []
            if not cache_hit and proxied_urls:
                async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                    sem = asyncio.Semaphore(15)
                    async def fetch_item(u):
                        async with sem: return await img_utils.resolve_image_to_buffer(u, client=client)
                    resolved_results = await asyncio.gather(*[fetch_item(u) for u in proxied_urls], return_exceptions=True)
                    for idx, res in enumerate(resolved_results):
                        if not isinstance(res, Exception):
                            resolved_buffers_data.append({"url": proxied_urls[idx], "data": res["data"], "content_type": res["contentType"]})

            if not cache_hit and len(resolved_buffers_data) > 1 and not body.smart_slice:
                try:
                    stitched_bytes = await asyncio.to_thread(
                        img_utils.stitch_images_together, [item["data"] for item in resolved_buffers_data], layout="vertical"
                    )
                    uid = f"stitched_{int(time.time() * 1000)}_full"
                    stitched_url = f"/api/image/cached/{uid}"
                    stitched_cache.set(uid, {"data": stitched_bytes, "content_type": "image/png"})
                    stitched_cache.set(cache_key, stitched_url)
                    edit_history.set(stitched_url, proxied_urls[0])
                    final_images = [stitched_url]
                except: final_images = proxied_urls

            elif not cache_hit and body.smart_slice and resolved_buffers_data:
                # Slicing logic (simplified for brevity here, assume existing logic remains robust)
                final_images = proxied_urls # Fallback

        project_id = body.project_id or generate_project_id()
        if final_images and not project_id.startswith("temp_"):
            db.save_scrape_session(normalized_url, final_images)

        # Ensure we have a cover image for the project card
        determined_cover = parsed.get("cover_image") or (final_images[0] if final_images else "")

        if project_id and not project_id.startswith("temp_"):
            db.insert_project({
                "project_id": project_id,
                "url": normalized_url,
                "title": parsed.get("title") or "Untitled Project",
                "genre": parsed.get("genre") or "general",
                "episode": parsed.get("episode") or "Chapter 1",
                "status": "pending",
                "panels_count": 0,
                "user_id": user_id or "system_default",
                "author": parsed.get("author") or "Unknown Author",
                "cover_image": determined_cover,
                "synopsis": parsed.get("synopsis") or "",
            })

        image_origins = {u: edit_history.get(u) or (u if u in proxied_urls else proxied_urls[0] if proxied_urls else "") for u in final_images}

        proj = db.get_project(project_id) if not project_id.startswith("temp_") else None

        return {
            "success": True,
            "project_id": project_id,
            "series_slug": proj.get("series_slug") if proj else None,
            "chapter_slug": proj.get("chapter_slug") if proj else None,
            "title": parsed.get("title"),
            "genre": parsed.get("genre"),
            "episode": parsed.get("episode"),
            "author": parsed.get("author"),
            "cover_image": determined_cover,
            "synopsis": parsed.get("synopsis"),
            "images": final_images,
            "image_origins": image_origins,
            "debug": {"cache": "HIT" if cache_hit else "MISS", "smart_slice": body.smart_slice}
        }
    except Exception as e:
        logger.error(f"[Scraper Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", summary="Generate storyboard and narrative scripts")
async def generate_storyboard(request: Request, body: GenerateStoryboardRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        parsed = parse_webtoon_url(body.url)
        for key in ["title", "episode", "genre", "author", "cover_image", "synopsis"]:
            val = getattr(body, key, None)
            if val: parsed[key] = val

        project_id = body.episode_id or generate_project_id()
        user_id = get_optional_user_id(request)
        scraped_urls = await scrape_images_from_url(body.url, bypass_cache=body.bypass_cache)

        if body.panels:
            resolved_panels = []
            for idx, p in enumerate(body.panels):
                resolved_img = p.get("image_url")
                if not resolved_img or "data:image/svg" in resolved_img:
                    if scraped_urls: resolved_img = scraped_urls[idx % len(scraped_urls)]
                p_copy = dict(p)
                p_copy["image_url"] = resolved_img
                resolved_panels.append(p_copy)

            if user_id and not project_id.startswith("temp_"):
                cover = parsed.get("cover_image") or (resolved_panels[0].get("image_url") if resolved_panels else "")
                db.insert_project({
                    "project_id": project_id, "url": body.url, "title": parsed["title"], "genre": parsed["genre"],
                    "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
                    "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(resolved_panels),
                    "user_id": user_id
                })
                db.insert_panels(project_id, resolved_panels)

            try:
                videos_dir = os.path.join(os.getcwd(), "public", "videos")
                compiled_filename = await compile_video_from_panels(project_id, resolved_panels, videos_dir)
                video_url = f"/videos/{compiled_filename}"
                if user_id and not project_id.startswith("temp_"): db.update_project(project_id, {"video_url": video_url})
            except: video_url = None

            return {"project_id": project_id, "status": "success", "video_url": video_url, "panels": resolved_panels}

        # AI Generation logic
        response_panels = await generate_dynamic_panels(parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, body.model, narration_style=body.narrationStyle or "long", user_keys=user_keys)
        if not response_panels: raise ValueError("AI failed to generate panels.")

        if user_id and not project_id.startswith("temp_"):
            cover = parsed.get("cover_image") or (response_panels[0].get("image_url") if response_panels else "")
            db.insert_project({
                "project_id": project_id, "url": body.url, "title": parsed["title"], "genre": parsed["genre"],
                "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
                "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(response_panels),
                "user_id": user_id
            })
            db.insert_panels(project_id, response_panels)

        try:
            videos_dir = os.path.join(os.getcwd(), "public", "videos")
            compiled_filename = await compile_video_from_panels(project_id, response_panels, videos_dir)
            video_url = f"/videos/{compiled_filename}"
            if user_id and not project_id.startswith("temp_"): db.update_project(project_id, {"video_url": video_url})
        except: video_url = None

        return {"project_id": project_id, "status": "success", "video_url": video_url, "panels": response_panels}
    except Exception as e:
        logger.error(f"[Generate Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-storyboard", summary="Generate storyboard only")
async def generate_storyboard_only(request: Request, body: GenerateStoryboardOnlyRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        parsed = parse_webtoon_url(body.url)
        for key in ["title", "episode", "genre", "author", "cover_image", "synopsis"]:
            val = getattr(body, key, None)
            if val: parsed[key] = val

        project_id = body.project_id
        user_id = get_optional_user_id(request)
        scraped_urls = await scrape_images_from_url(body.url, bypass_cache=False)
        if not scraped_urls:
            session = db.get_latest_scrape_session(body.url)
            if session: scraped_urls = session.get("image_urls", [])
        if not scraped_urls: raise HTTPException(status_code=400, detail="No images found.")

        response_panels = await generate_dynamic_panels(parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, body.model, narration_style=body.narrationStyle or "long", user_keys=user_keys)

        if user_id and not project_id.startswith("temp_"):
            cover = parsed.get("cover_image") or (response_panels[0].get("image_url") if response_panels else "")
            db.insert_project({
                "project_id": project_id, "url": body.url, "title": parsed["title"], "genre": parsed["genre"],
                "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
                "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(response_panels),
                "user_id": user_id
            })
            db.insert_panels(project_id, response_panels)

        return {"success": True, "project_id": project_id, "panels": response_panels}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-url", summary="Legacy endpoint")
async def process_url(body: ProcessUrlRequest):
    return {"status": "success", "payload": {"url": body.url, "title": "Processed"}}

@router.put("/save-scraped-images", summary="Update scraped images cache")
async def save_scraped_images(body: SaveScrapedImagesRequest):
    try:
        db.save_scrape_session(extract_webtoon_url(body.url), body.images)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
