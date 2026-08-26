"""
backend/app/services/scraper/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for coordinating Webtoon scraping, metadata merging, full-strip
stitching/caching, project initialization, and storyboard generation.
Consumes authoritative ChapterResult from AdaptiveScraperEngine.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import time
import httpx
import asyncio
import logging
from typing import List, Optional, Dict, Any
from urllib.parse import quote

from .scraper_engine import AdaptiveScraperEngine
from .scraper_models import ChapterResult
from .url_utils import UrlNormalizer
from .scraper_constants import SCRAPER_VERSION

import services.image.utils.image_utils as img_utils
try:
    from core.config import call_gemini_with_retry, genai_client, ai_initialized, GEMINI_MODEL_PRIMARY, GEMINI_FALLBACK_MODELS
    from core.cache import stitched_cache, edit_history
    from core.utils.id_utils import generate_project_id
except ImportError:
    from app.core.config import call_gemini_with_retry, genai_client, ai_initialized, GEMINI_MODEL_PRIMARY, GEMINI_FALLBACK_MODELS
    from app.core.cache import stitched_cache, edit_history
    from app.core.utils.id_utils import generate_project_id
from services.ai.pipelines.storyboard_ai import generate_dynamic_panels
from services.video.video import compile_video_from_panels
from repositories.scraper import save_scrape_session, get_latest_scrape_session
from repositories.project.panels import save_edit_history, insert_panels
from repositories.project.project import update_project, insert_project, get_project

logger = logging.getLogger("sonikoma.services.scraper.service")


def wrap_proxy_image(img_url: str, referer_url: str) -> str:
    """Wraps an external image URL in the local image proxy endpoint."""
    if not img_url or img_url.startswith("/api/proxy-image") or "/api/proxy-image" in img_url or img_url.startswith("data:image/"):
        return img_url
    return f"/api/proxy-image?url={quote(img_url)}&referer={quote(referer_url)}"


async def scrape_chapter_service(
    url: str,
    project_id: Optional[str] = None,
    force_refresh: bool = False,
    cookies: Optional[Dict[str, str]] = None,
    headers: Optional[Dict[str, str]] = None,
    limit: Optional[int] = None,
    proxy_images: bool = True,
    filter_banners: bool = True
) -> ChapterResult:
    """
    Authoritative service entry point for single chapter scraping.
    Delegates directly to AdaptiveScraperEngine and returns unified ChapterResult.
    """
    result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
        url=url,
        cookies=cookies,
        headers=headers,
        bypass_cache=force_refresh,
        limit=limit,
        proxy_images=proxy_images,
        filter_banners=filter_banners
    )
    if proxy_images and result.images:
        canonical = result.source.canonical_url or url
        for img in result.images:
            img.url = wrap_proxy_image(img.url, canonical)
    return result


async def scrape_images_from_url(
    url: str,
    source: Optional[str] = None,
    cookies: Optional[Dict[str, str]] = None,
    headers: Optional[Dict[str, str]] = None,
    bypass_cache: bool = False,
    limit: Optional[int] = None,
    proxy_images: bool = True,
    filter_banners: bool = True,
    save_debug_html: bool = False
) -> List[str]:
    """
    Compatibility facade for crawling a Webtoon episode page and returning panel image URLs.
    Delegates to AdaptiveScraperEngine.
    """
    result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
        url=url,
        cookies=cookies,
        headers=headers,
        bypass_cache=bypass_cache,
        limit=limit,
        proxy_images=proxy_images,
        filter_banners=filter_banners
    )

    if not result.success or not result.images:
        return []

    image_urls = [img.url for img in result.images]
    if not proxy_images:
        return image_urls

    canonical = result.source.canonical_url or url
    return [wrap_proxy_image(u, canonical) for u in image_urls]


async def scrape_and_initialize_project(
    url: str,
    source: Optional[str] = None,
    cookies: Optional[Dict[str, str]] = None,
    headers: Optional[Dict[str, str]] = None,
    bypass_cache: bool = False,
    smart_slice: bool = False,
    scrape_only: bool = False,
    project_id: Optional[str] = None,
    job_id: Optional[str] = None,
    user_id: Optional[str] = None,
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None,
    limit: Optional[int] = None,
    proxy_images: bool = True,
    filter_banners: bool = True,
    include_metadata: bool = True
) -> Dict[str, Any]:
    """
    Scrapes image panels using the AdaptiveScraperEngine, merges metadata, handles stitching,
    caches the results, and initializes a database project record.
    """
    start_time = time.time()
    normalized_url = UrlNormalizer.normalize_url(url)
    logger.info(f"[Scraper Service] Processing scrape request: {normalized_url}")
    logger.debug(
        f"[Scraper Service] Parameters: project_id={project_id}, job_id={job_id}, "
        f"scrape_only={scrape_only}, smart_slice={smart_slice}, proxy_images={proxy_images}, limit={limit}"
    )

    result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
        url=normalized_url,
        cookies=cookies,
        headers=headers,
        bypass_cache=bypass_cache,
        limit=limit,
        proxy_images=proxy_images,
        filter_banners=filter_banners
    )

    if not result.success:
        err_msg = result.error_message or "Failed to scrape chapter images."
        logger.warning(f"[Scraper Service] Adaptive scrape returned unsuccessful: {err_msg}")
        return {
            "success": False,
            "error": err_msg,
            "images": [],
            "total_images": 0
        }

    # Extract metadata from ChapterResult with manual overrides
    final_title = title or result.series.title or "Comic"
    final_episode = episode or result.chapter.episode or (f"Episode {int(result.chapter.number)}" if result.chapter.number else "Episode 1")
    final_genre = genre or (result.series.genres[0] if result.series.genres else "general")
    final_author = author or result.series.author or "Unknown Author"
    final_cover = cover_image or result.series.cover_image or ""
    final_synopsis = synopsis or result.series.description or ""

    logger.debug(
        f"[Scraper Service] Resolved metadata: title='{final_title}', episode='{final_episode}', "
        f"author='{final_author}', genre='{final_genre}', cover_image='{final_cover[:50]}...'"
    )

    raw_urls = [img.url for img in result.images]
    canonical = result.source.canonical_url or normalized_url
    proxied_urls = [wrap_proxy_image(u, canonical) for u in raw_urls] if proxy_images else raw_urls
    logger.debug(f"[Scraper Service] Discovered {len(raw_urls)} image URL(s), canonical='{canonical}'")

    final_images = proxied_urls

    if not scrape_only:
        # Buffer resolution and stitching
        resolved_buffers_data = []
        if proxied_urls:
            logger.debug(f"[Scraper Service] Resolving {len(proxied_urls)} image buffers concurrently (concurrency=15)...")
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                sem = asyncio.Semaphore(15)
                async def fetch_item(u):
                    async with sem:
                        return await img_utils.resolve_image_to_buffer(u, client=client)
                resolved_results = await asyncio.gather(*[fetch_item(u) for u in proxied_urls], return_exceptions=True)
                for idx, res in enumerate(resolved_results):
                    if not isinstance(res, BaseException) and res and "data" in res:
                        resolved_buffers_data.append({
                            "url": proxied_urls[idx],
                            "data": res["data"],
                            "content_type": res.get("contentType", "image/png")
                        })
            logger.debug(f"[Scraper Service] Successfully resolved {len(resolved_buffers_data)}/{len(proxied_urls)} image buffers in memory")

        if len(resolved_buffers_data) > 1 and not smart_slice:
            try:
                logger.debug(f"[Scraper Service] Stitching {len(resolved_buffers_data)} image slices vertically...")
                stitched_bytes = await asyncio.to_thread(
                    img_utils.stitch_images_together, [item["data"] for item in resolved_buffers_data], layout="vertical"
                )
                if stitched_bytes:
                    filename = f"stitched_{int(time.time())}.png"
                    saved_path = img_utils.save_image_to_cache(stitched_bytes, filename)
                    stitched_url = f"/api/cache-image/{filename}"
                    if hasattr(stitched_cache, "set"):
                        stitched_cache.set(normalized_url, {"data": stitched_bytes, "content_type": "image/png"})
                    else:
                        stitched_cache[normalized_url] = {"data": stitched_bytes, "content_type": "image/png"}
                    final_images = [stitched_url]
                    logger.debug(f"[Scraper Service] Stitching completed: {stitched_url} (size={len(stitched_bytes)} bytes)")
            except Exception as stitch_err:
                logger.error(f"[Scraper Service] Stitching exception: {stitch_err}")

    # Initialize or update project record in database
    active_project_id = project_id or generate_project_id()
    logger.debug(f"[Scraper Service] Target project ID: {active_project_id}")
    project_payload = {
        "id": active_project_id,
        "project_id": active_project_id,
        "job_id": job_id,
        "title": final_title,
        "episode": final_episode,
        "genre": final_genre,
        "author": final_author,
        "cover_image": final_cover,
        "synopsis": final_synopsis,
        "source_url": normalized_url,
        "total_panels": len(final_images),
        "user_id": user_id
    }

    try:
        existing = get_project(active_project_id)
        if existing:
            update_project(active_project_id, project_payload)
        else:
            insert_project(project_payload)
    except Exception as db_err:
        logger.debug(f"[Scraper Service] Database save notice: {db_err}")

    elapsed_ms = (time.time() - start_time) * 1000.0

    return {
        "success": True,
        "project_id": active_project_id,
        "chapter_id": active_project_id,
        "job_id": job_id,
        "title": final_title,
        "episode": final_episode,
        "genre": final_genre,
        "author": final_author,
        "cover_image": final_cover,
        "synopsis": final_synopsis,
        "images": final_images,
        "total_images": len(final_images),
        "execution_time_ms": elapsed_ms,
        "metadata": {
            "title": final_title,
            "episode": final_episode,
            "genre": final_genre,
            "author": final_author,
            "cover_image": final_cover,
            "synopsis": final_synopsis
        },
        "debug": {
            "cache": "LIVE_AUTHORITATIVE",
            "completeness": result.scrape.completeness.value,
            "confidence": result.scrape.confidence,
            "smart_slice": smart_slice,
            "proxy_images": proxy_images,
            "filter_banners": filter_banners,
            "limit": limit
        }
    }


async def generate_storyboard_and_video(
    url: str,
    project_id: Optional[str] = None,
    job_id: Optional[str] = None,
    panels: Optional[List[Dict[str, Any]]] = None,
    custom_background_video: Optional[str] = None,
    model: Optional[str] = None,
    narration_style: str = "long",
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None,
    user_id: Optional[str] = None,
    bypass_cache: bool = True,
    user_keys: Optional[Dict[str, str]] = None,
    episode_id: Optional[str] = None,
    **kwargs: Any
) -> Dict[str, Any]:
    """Generates storyboard script and compiles video from panels."""
    scrape_res = await scrape_and_initialize_project(
        url=url,
        project_id=project_id,
        job_id=job_id,
        user_id=user_id,
        title=title,
        episode=episode or episode_id,
        genre=genre,
        author=author,
        cover_image=cover_image,
        synopsis=synopsis,
        bypass_cache=bypass_cache
    )
    if not scrape_res.get("success"):
        return scrape_res

    active_id = scrape_res["project_id"]
    images = scrape_res.get("images", [])

    generated_panels = await generate_dynamic_panels(
        title=scrape_res.get("title") or title or "Comic Recap",
        genre=scrape_res.get("genre") or genre or "Action",
        episode=scrape_res.get("episode") or episode or episode_id or "Episode 1",
        img_urls=images,
        synopsis=scrape_res.get("synopsis", "") or synopsis or "",
        narration_style=narration_style,
        model=model,
        user_keys=user_keys
    )

    video_res = await compile_video_from_panels(
        panels=generated_panels,
        project_id=active_id,
        custom_background_video=custom_background_video
    )

    return {
        "success": True,
        "project_id": active_id,
        "storyboard": generated_panels,
        "video": video_res
    }


async def generate_storyboard_only_service(
    url: str,
    project_id: str,
    job_id: Optional[str] = None,
    model: Optional[str] = None,
    narration_style: str = "long",
    title: Optional[str] = None,
    episode: Optional[str] = None,
    genre: Optional[str] = None,
    author: Optional[str] = None,
    cover_image: Optional[str] = None,
    synopsis: Optional[str] = None,
    user_id: Optional[str] = None,
    user_keys: Optional[Dict[str, str]] = None,
    episode_id: Optional[str] = None,
    **kwargs: Any
) -> Dict[str, Any]:
    """Generates storyboard panel scripts from URL without compiling video."""
    try:
        scrape_res = await scrape_and_initialize_project(
            url=url,
            project_id=project_id,
            job_id=job_id,
            user_id=user_id,
            title=title,
            episode=episode or episode_id,
            genre=genre,
            author=author,
            cover_image=cover_image,
            synopsis=synopsis
        )
        if not scrape_res.get("success"):
            return scrape_res

        images = scrape_res.get("images", [])
        generated_panels = await generate_dynamic_panels(
            title=scrape_res.get("title") or title or "Comic Recap",
            genre=scrape_res.get("genre") or genre or "Action",
            episode=scrape_res.get("episode") or episode or episode_id or "Episode 1",
            img_urls=images,
            synopsis=scrape_res.get("synopsis", "") or synopsis or "",
            narration_style=narration_style,
            model=model,
            user_keys=user_keys
        )

        result_payload = {
            "success": True,
            "project_id": project_id,
            "storyboard": generated_panels
        }

        if job_id:
            from services.jobs.manager import job_manager
            job_manager.complete_job(job_id, result_payload)

        return result_payload
    except Exception as e:
        logger.error(f"[Storyboard Only Service] Execution failed: {e}", exc_info=True)
        from services.ai.orchestrator import classify_error
        classified = classify_error(e, model=model)
        err_dict = classified.to_dict()
        err_dict["failed_stage"] = "storyboard_generation"

        if job_id:
            from services.jobs.manager import job_manager
            job_manager.fail_job(
                job_id,
                error_message=err_dict.get("error_message") or str(e),
                error_code=err_dict.get("error_code"),
                details=err_dict
            )

        return {
            "success": False,
            "error": err_dict["error_message"],
            "error_code": err_dict["error_code"],
            "failed_stage": "storyboard_generation",
            "project_id": project_id
        }
