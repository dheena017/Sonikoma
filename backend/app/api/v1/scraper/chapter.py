"""
backend/app/api/v1/scraper/chapter.py
─────────────────────────────────────────────────────────────────────────────
Chapter panel extraction endpoints.
POST /chapter             – Scrape single chapter (Async Background Job)
POST /chapter/sync        – Scrape single chapter (Direct Synchronous)
GET  /chapter/sync        – Same via query parameter
POST /reader-chapter      – Reader-optimised proxied chapter panels
GET  /reader-chapter      – Same via query parameter
POST /chapter/metadata    – Extract chapter metadata only (no images)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Depends, Query

from api.dependencies.auth import get_current_user, get_optional_current_user
from api.v1.scraper._shared import parse_cookie_string, assert_not_blocked
from schemas.scraper import ScrapeChapterRequest, ChapterResult, SeparateUrlRequest
from services.scraper.scraper_engine import AdaptiveScraperEngine
from services.scraper.acquisition.http_page_fetcher import HttpFetcher
from services.scraper.extraction.html_dom_extractor import DomExtractor
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.scraper.chapter")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/chapter",
    response_model=JobStatusResponse,
    summary="Scrape single chapter URL (Async Job)",
    description="Submits a background SCRAPE_CHAPTER Job that discovers, filters, and orders comic panels with stage progress."
)
async def scrape_chapter_async_endpoint(
    body: ScrapeChapterRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required.")

    target_url = body.url.strip()
    assert_not_blocked(target_url)
    logger.info(f"[ScraperAPI] POST /chapter: url='{target_url}', force_refresh={body.force_refresh}")

    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    job = job_manager.create_job(
        job_type=JobType.SCRAPE_CHAPTER,
        user_id=user_id,
        project_id=body.project_id or "Comic Chapter",
        chapter_id=body.chapter_id,
        metadata={"url": target_url}
    )

    clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
    parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
    bypass = True if body.force_refresh else (body.bypass_cache or False)

    async def _scrape_coro(report_progress):
        report_progress(10.0, JobStage.ANALYZING_URL.value)
        report_progress(30.0, JobStage.FETCHING.value)
        result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
            url=target_url,
            cookies=parsed_cookies,
            headers=clean_headers,
            bypass_cache=bypass,
            limit=body.limit,
            proxy_images=body.proxy_images if body.proxy_images is not None else True,
            filter_banners=body.filter_banners if body.filter_banners is not None else True,
            project_id=body.project_id,
            job_id=job.job_id
        )
        if result.series and result.series.title:
            job.project_id = result.series.title
        if result.chapter and (result.chapter.title or result.chapter.number is not None):
            job.chapter_id = result.chapter.title or f"Episode {result.chapter.number}"

        if result.success and result.images:
            try:
                from repositories.scraper import save_scrape_session
                img_urls = [
                    img.url if hasattr(img, "url") else (img.get("url") if isinstance(img, dict) else str(img))
                    for img in result.images
                ]
                save_scrape_session(target_url, img_urls)

                if body.project_id:
                    from repositories.project import get_project, insert_project, update_project
                    series_title = result.series.title if result.series and result.series.title else "Untitled Comic"
                    cover_img = (result.series.cover_image if result.series and result.series.cover_image else None) or (img_urls[0] if img_urls else None)
                    genre = (result.series.genres[0] if result.series and result.series.genres else "general")
                    synopsis = result.series.description if result.series and result.series.description else ""
                    author = result.series.author if result.series and result.series.author else "Unknown Author"
                    episode_str = result.chapter.title or f"Chapter {result.chapter.number or 1}" if result.chapter else "Chapter 1"

                    payload = {
                        "project_id": body.project_id,
                        "user_id": user_id,
                        "title": series_title,
                        "author": author,
                        "cover_image": cover_img,
                        "genre": genre,
                        "synopsis": synopsis,
                        "episode": episode_str,
                        "url": target_url,
                        "source_url": target_url,
                        "status": "pending",
                        "panels_count": 0,
                        "imported_assets_count": len(img_urls),
                        "audio_settings": {
                            "scraped_images": img_urls,
                            "imported_assets_count": len(img_urls),
                        }
                    }
                    existing_p = get_project(body.project_id)
                    if existing_p:
                        update_project(body.project_id, payload)
                    else:
                        insert_project(payload)
                    logger.info(f"[ScraperAPI] Async job persisted project {body.project_id} with {len(img_urls)} scraped images")
            except Exception as persist_err:
                logger.warning(f"[ScraperAPI] Error auto-saving async scrape session/project: {persist_err}")

        report_progress(100.0, JobStage.COMPLETED.value)
        return result.model_dump()

    job_manager.run_in_background(job.job_id, _scrape_coro)
    return job.to_status_response()


@router.post(
    "/chapter/sync",
    response_model=ChapterResult,
    summary="Scrape single chapter URL (Direct Synchronous)",
    description="Directly executes chapter extraction and returns the authoritative ChapterResult immediately."
)
async def scrape_chapter_sync_post(
    body: ScrapeChapterRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required.")

    target_url = body.url.strip()
    assert_not_blocked(target_url)
    logger.info(f"[ScraperAPI] POST /chapter/sync: url='{target_url}'")

    clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
    parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
    bypass = True if body.force_refresh else (body.bypass_cache or False)

    result = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        cookies=parsed_cookies,
        headers=clean_headers,
        bypass_cache=bypass,
        limit=body.limit,
        proxy_images=body.proxy_images if body.proxy_images is not None else True,
        filter_banners=body.filter_banners if body.filter_banners is not None else True,
        project_id=body.project_id
    )
    if result.success:
        logger.info(f"[ScraperAPI] Successfully scraped chapter '{target_url}' ({len(result.images)} panels)")
        try:
            from repositories.scraper import save_scrape_session
            img_urls = [
                img.url if hasattr(img, "url") else (img.get("url") if isinstance(img, dict) else str(img))
                for img in result.images
            ]
            save_scrape_session(target_url, img_urls)
            if body.project_id:
                from repositories.project import get_project, insert_project, update_project
                user_id = current_user.get("user_id") or current_user.get("id") or "system_default" if current_user else "system_default"
                series_title = result.series.title if result.series and result.series.title else "Untitled Comic"
                cover_img = (result.series.cover_image if result.series and result.series.cover_image else None) or (img_urls[0] if img_urls else None)
                genre = (result.series.genres[0] if result.series and result.series.genres else "general")
                synopsis = result.series.description if result.series and result.series.description else ""
                author = result.series.author if result.series and result.series.author else "Unknown Author"
                episode_str = result.chapter.title or f"Chapter {result.chapter.number or 1}" if result.chapter else "Chapter 1"

                payload = {
                    "project_id": body.project_id,
                    "user_id": user_id,
                    "title": series_title,
                    "author": author,
                    "cover_image": cover_img,
                    "genre": genre,
                    "synopsis": synopsis,
                    "episode": episode_str,
                    "url": target_url,
                    "source_url": target_url,
                    "status": "pending",
                    "panels_count": len(img_urls),
                    "total_panels": len(img_urls),
                    "audio_settings": {
                        "scraped_images": img_urls,
                        "imported_assets_count": len(img_urls),
                    }
                }
                existing_p = get_project(body.project_id)
                if existing_p:
                    update_project(body.project_id, payload)
                else:
                    insert_project(payload)
                logger.info(f"[ScraperAPI] Persisted project {body.project_id} with {len(img_urls)} scraped images")
        except Exception as persist_err:
            logger.warning(f"[ScraperAPI] Non-fatal error persisting scraped project: {persist_err}")
    else:
        logger.warning(f"[ScraperAPI] Failed scraping chapter '{target_url}': {result.error_message}")
    return result


@router.get(
    "/chapter/sync",
    response_model=ChapterResult,
    summary="Scrape single chapter URL via GET query parameter"
)
async def scrape_chapter_sync_get(
    url: str = Query(..., description="Target chapter URL"),
    filter_banners: bool = Query(True, description="Filter out ad banners & tracking pixels"),
    proxy_images: bool = Query(True, description="Proxy image URLs for hotlink bypass"),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not url or not url.strip():
        logger.warning("[ScraperAPI] GET /chapter/sync received empty URL")
        raise HTTPException(status_code=400, detail="URL query parameter is required.")
    target_url = url.strip()
    logger.info(f"[ScraperAPI] GET /chapter/sync: url='{target_url}'")
    result = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        proxy_images=proxy_images,
        filter_banners=filter_banners
    )
    if result.success:
        logger.info(f"[ScraperAPI] Successfully scraped chapter '{target_url}' ({len(result.images)} panels)")
    else:
        logger.warning(f"[ScraperAPI] Failed scraping chapter '{target_url}': {result.error_message}")
    return result


@router.post(
    "/reader-chapter",
    summary="Scrape & return optimized chapter reading panels",
    description="Dedicated fast endpoint for chapter reader strip with proxied and high-res image URLs."
)
async def get_reader_chapter_panels_post(
    body: ScrapeChapterRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Chapter URL is required.")
    target_url = body.url.strip()
    result = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        bypass_cache=bool(body.force_refresh or body.bypass_cache),
        proxy_images=False,
        filter_banners=True
    )
    panels = []
    for idx, img in enumerate(result.images):
        raw_u = img.url if hasattr(img, "url") else str(img)
        proxied_u = f"/api/v1/proxy/image?url={quote(raw_u, safe='')}&referer={quote(target_url, safe='')}"
        panels.append({"index": idx, "url": raw_u, "proxied_url": proxied_u,
                        "width": getattr(img, "width", None), "height": getattr(img, "height", None)})
    return {
        "success": result.success if result else bool(panels),
        "url": target_url,
        "series_title": result.series.title if result and result.series else "",
        "chapter_title": result.chapter.title if result and result.chapter else "",
        "chapter_number": result.chapter.number if result and result.chapter else None,
        "total_panels": len(panels),
        "panels": panels,
        "images": [p["proxied_url"] for p in panels],
        "raw_images": [p["url"] for p in panels]
    }


@router.get(
    "/reader-chapter",
    summary="Get chapter reader panels via GET query"
)
async def get_reader_chapter_panels_get(
    url: str = Query(..., description="Target chapter URL"),
    force_refresh: bool = Query(False, description="Bypass cache"),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="URL query parameter is required.")
    target_url = url.strip()
    result = await AdaptiveScraperEngine.scrape_url(
        url=target_url,
        bypass_cache=force_refresh,
        proxy_images=False,
        filter_banners=True
    )
    panels = []
    for idx, img in enumerate(result.images):
        raw_u = img.url if hasattr(img, "url") else str(img)
        proxied_u = f"/api/v1/proxy/image?url={quote(raw_u, safe='')}&referer={quote(target_url, safe='')}"
        panels.append({"index": idx, "url": raw_u, "proxied_url": proxied_u,
                        "width": getattr(img, "width", None), "height": getattr(img, "height", None)})
    return {
        "success": result.success if result else bool(panels),
        "url": target_url,
        "series_title": result.series.title if result and result.series else "",
        "chapter_title": result.chapter.title if result and result.chapter else "",
        "chapter_number": result.chapter.number if result and result.chapter else None,
        "total_panels": len(panels),
        "panels": panels,
        "images": [p["proxied_url"] for p in panels],
        "raw_images": [p["url"] for p in panels]
    }


@router.post(
    "/chapter/metadata",
    summary="Extract chapter metadata only (without images)"
)
async def scrape_chapter_metadata_endpoint(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    html, _, _ = await HttpFetcher.fetch_html(payload.url)
    if not html:
        raise HTTPException(status_code=400, detail="Could not fetch page content.")
    series_info, chapter_info = DomExtractor.extract_metadata(html, payload.url)
    return {
        "url": payload.url,
        "series": series_info.model_dump() if series_info else None,
        "chapter": chapter_info.model_dump() if chapter_info else None
    }
