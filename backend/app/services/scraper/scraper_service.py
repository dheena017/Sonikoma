"""
backend/app/services/scraper/scraper_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for coordinating Webtoon scraping, metadata merging, full-strip
stitching/caching, project initialization, and storyboard generation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import httpx
import asyncio
import logging
from typing import List, Optional, Dict, Any


from services.scraper.url_utils import extract_webtoon_url, parse_webtoon_url
from core.utils.id_utils import generate_project_id
from core.cache import stitched_cache, edit_history
import services.image.utils.image_utils as img_utils
from services.scraper.scraper import scrape_images_from_url, scraped_metadata_cache
from media.ai.storyboard_ai import generate_dynamic_panels
from services.video.video import compile_video_from_panels
from repositories.scraper import save_scrape_session, get_latest_scrape_session
from repositories.project.panels import save_edit_history, insert_panels
from repositories.project.project import update_project, insert_project, get_project

logger = logging.getLogger("sonikoma.services.scraper.scraper_service")


async def scrape_and_initialize_project(
    url: str,
    source: Optional[str] = None,
    bypass_cache: bool = False,
    smart_slice: bool = False,
    scrape_only: bool = False,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None
) -> Dict[str, Any]:
    """
    Scrapes image panels from a Webtoon URL, merges metadata, handles stitching,
    caches the results, and initializes a database project record.
    """
    normalized_url = extract_webtoon_url(url)
    parsed = parse_webtoon_url(normalized_url)

    # Override parsed info with provided arguments
    overrides = {
        "title": title, "episode": episode, "genre": genre,
        "author": author, "cover_image": cover_image, "synopsis": synopsis
    }
    for key, val in overrides.items():
        if val:
            parsed[key] = val

    logger.info(f"[Scraper Service] Processing scrape request: {normalized_url}")
    proxied_urls = await scrape_images_from_url(normalized_url, source, bypass_cache=bypass_cache)

    # Merge scraped metadata from cache
    metadata = scraped_metadata_cache.get(normalized_url, {})
    if metadata:
        if not parsed.get("title"): parsed["title"] = metadata.get("title")
        if not parsed.get("genre"): parsed["genre"] = metadata.get("genre")
        if not parsed.get("author"): parsed["author"] = metadata.get("author")
        if not parsed.get("cover_image"): parsed["cover_image"] = metadata.get("cover_image")
        if not parsed.get("synopsis"): parsed["synopsis"] = metadata.get("description") or metadata.get("synopsis")

    final_images = proxied_urls
    cache_hit = False

    if not scrape_only:
        cache_key = f"stitched_full_{normalized_url}"
        if not bypass_cache:
            cached_url = stitched_cache.get(cache_key)
            if cached_url:
                final_images = [cached_url]
                cache_hit = True

        resolved_buffers_data = []
        if not cache_hit and proxied_urls:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                sem = asyncio.Semaphore(15)
                async def fetch_item(u):
                    async with sem:
                        return await img_utils.resolve_image_to_buffer(u, client=client)
                resolved_results = await asyncio.gather(*[fetch_item(u) for u in proxied_urls], return_exceptions=True)
                for idx, res in enumerate(resolved_results):
                    if not isinstance(res, Exception):
                        resolved_buffers_data.append({
                            "url": proxied_urls[idx],
                            "data": res["data"],
                            "content_type": res["contentType"]
                        })

        if not cache_hit and len(resolved_buffers_data) > 1 and not smart_slice:
            try:
                stitched_bytes = await asyncio.to_thread(
                    img_utils.stitch_images_together, [item["data"] for item in resolved_buffers_data], layout="vertical"
                )
                uid = f"stitched_{int(time.time() * 1000)}_full"
                stitched_url = f"/api/image/cached/{uid}"
                stitched_cache.set(uid, {"data": stitched_bytes, "content_type": "image/png"})
                stitched_cache.set(cache_key, stitched_url)
                edit_history.set(stitched_url, proxied_urls[0])
                try:
                    save_edit_history(stitched_url, proxied_urls[0])
                except Exception:
                    pass
                final_images = [stitched_url]
            except Exception as e:
                logger.warning(f"[Scraper Service] Stitching failed: {e}")
                final_images = proxied_urls
        elif not cache_hit and smart_slice and resolved_buffers_data:
            final_images = proxied_urls  # Fallback/Simplified behavior preservation

    resolved_project_id = project_id or generate_project_id()
    if final_images and not resolved_project_id.startswith("temp_"):
        save_scrape_session(normalized_url, final_images)

    determined_cover = parsed.get("cover_image") or (final_images[0] if final_images else "")

    if resolved_project_id and not resolved_project_id.startswith("temp_"):
        insert_project({
            "project_id": resolved_project_id,
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

    image_origins = {
        u: edit_history.get(u) or (u if u in proxied_urls else proxied_urls[0] if proxied_urls else "")
        for u in final_images
    }

    proj = get_project(resolved_project_id) if not resolved_project_id.startswith("temp_") else None

    return {
        "success": bool(final_images),
        "project_id": resolved_project_id,
        "series_slug": proj.get("series_slug") if proj else None,
        "chapter_slug": proj.get("chapter_slug") if proj else None,
        "title": parsed.get("title"),
        "genre": parsed.get("genre"),
        "episode": parsed.get("episode"),
        "author": parsed.get("author"),
        "cover_image": determined_cover,
        "synopsis": parsed.get("synopsis"),
        "images": final_images,
        "total_images": len(final_images),
        "image_origins": image_origins,
        "debug": {"cache": "HIT" if cache_hit else "MISS", "smart_slice": smart_slice}
    }


async def generate_storyboard_and_video(
    url: str,
    model: str,
    narration_style: str = "long",
    bypass_cache: bool = False,
    panels: Optional[List[Dict[str, Any]]] = None,
    episode_id: Optional[str] = None,
    user_id: Optional[str] = None,
    user_keys: Optional[dict] = None,
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a storyboard from visual panels (either via manual input or AI generation)
    and compiles a video from them.
    """
    parsed = parse_webtoon_url(url)
    overrides = {
        "title": title, "episode": episode, "genre": genre,
        "author": author, "cover_image": cover_image, "synopsis": synopsis
    }
    for key, val in overrides.items():
        if val:
            parsed[key] = val

    resolved_project_id = episode_id or generate_project_id()
    scraped_urls = await scrape_images_from_url(url, bypass_cache=bypass_cache)

    if panels:
        resolved_panels = []
        for idx, p in enumerate(panels):
            resolved_img = p.get("image_url")
            if not resolved_img or "data:image/svg" in resolved_img:
                if scraped_urls:
                    resolved_img = scraped_urls[idx % len(scraped_urls)]
            p_copy = dict(p)
            p_copy["image_url"] = resolved_img
            resolved_panels.append(p_copy)

        if user_id and not resolved_project_id.startswith("temp_"):
            cover = parsed.get("cover_image") or (resolved_panels[0].get("image_url") if resolved_panels else "")
            insert_project({
                "project_id": resolved_project_id, "url": url, "title": parsed["title"], "genre": parsed["genre"],
                "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
                "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(resolved_panels),
                "user_id": user_id
            })
            insert_panels(resolved_project_id, resolved_panels)

        try:
            videos_dir = os.path.join(os.getcwd(), "data", "media")
            compiled_filename = await compile_video_from_panels(resolved_project_id, resolved_panels, videos_dir)
            video_url = f"/videos/{compiled_filename}"
            if user_id and not resolved_project_id.startswith("temp_"):
                update_project(resolved_project_id, {"video_url": video_url})
        except Exception:
            video_url = None

        return {"project_id": resolved_project_id, "status": "success", "video_url": video_url, "panels": resolved_panels}

    # AI Generation path
    response_panels = await generate_dynamic_panels(
        parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, model,
        narration_style=narration_style, user_keys=user_keys
    )
    if not response_panels:
        raise ValueError("AI failed to generate panels.")

    if user_id and not resolved_project_id.startswith("temp_"):
        cover = parsed.get("cover_image") or (response_panels[0].get("image_url") if response_panels else "")
        insert_project({
            "project_id": resolved_project_id, "url": url, "title": parsed["title"], "genre": parsed["genre"],
            "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
            "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(response_panels),
            "user_id": user_id
        })
        insert_panels(resolved_project_id, response_panels)

    try:
        videos_dir = os.path.join(os.getcwd(), "data", "media")
        compiled_filename = await compile_video_from_panels(resolved_project_id, response_panels, videos_dir)
        video_url = f"/videos/{compiled_filename}"
        if user_id and not resolved_project_id.startswith("temp_"):
            update_project(resolved_project_id, {"video_url": video_url})
    except Exception:
        video_url = None

    return {"project_id": resolved_project_id, "status": "success", "video_url": video_url, "panels": response_panels}


async def generate_storyboard_only_service(
    url: str,
    project_id: str,
    model: str,
    narration_style: str = "long",
    user_id: Optional[str] = None,
    user_keys: Optional[dict] = None,
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None
) -> Dict[str, Any]:
    """Generates a storyboard from a Webtoon URL without rendering a video."""
    parsed = parse_webtoon_url(url)
    overrides = {
        "title": title, "episode": episode, "genre": genre,
        "author": author, "cover_image": cover_image, "synopsis": synopsis
    }
    for key, val in overrides.items():
        if val:
            parsed[key] = val

    scraped_urls = await scrape_images_from_url(url, bypass_cache=False)
    if not scraped_urls:
        session = get_latest_scrape_session(url)
        if session:
            scraped_urls = session.get("image_urls", [])

    if not scraped_urls:
        raise ValueError("No images found.")

    response_panels = await generate_dynamic_panels(
        parsed["title"], parsed["genre"], parsed["episode"], scraped_urls, model,
        narration_style=narration_style, user_keys=user_keys
    )

    if user_id and not project_id.startswith("temp_"):
        cover = parsed.get("cover_image") or (response_panels[0].get("image_url") if response_panels else "")
        insert_project({
            "project_id": project_id, "url": url, "title": parsed["title"], "genre": parsed["genre"],
            "episode": parsed["episode"], "author": parsed.get("author"), "cover_image": cover,
            "synopsis": parsed.get("synopsis"), "status": "pending", "panels_count": len(response_panels),
            "user_id": user_id
        })
        insert_panels(project_id, response_panels)

    return {"success": True, "project_id": project_id, "panels": response_panels}
