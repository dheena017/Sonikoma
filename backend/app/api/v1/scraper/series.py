"""
backend/app/api/v1/scraper/series.py
─────────────────────────────────────────────────────────────────────────────
Series & episode discovery endpoints.
POST /series         – Discover series episodes & metadata (Async Job)
POST /series/sync    – Discover series episodes & metadata (Direct Sync)
GET  /series/sync    – Same via query parameter
POST /batch          – Batch scrape multiple chapter URLs (Async Job)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

from api.dependencies.auth import get_current_user
from api.v1.scraper._shared import parse_cookie_string, assert_not_blocked
from schemas.scraper import ScrapeEpisodesRequest, BatchScrapeRequest
from services.scraper.scraper_engine import AdaptiveScraperEngine
from services.scraper.scraper_workflow import scrape_series_chapters_advanced
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse

logger = logging.getLogger("sonikoma.api.scraper.series")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/series",
    response_model=JobStatusResponse,
    summary="Discover series episodes & metadata (Async Job)",
    description="Submits a background DISCOVER_EPISODES Job to crawl comic chapter lists, ratings, pagination, and release dates."
)
async def scrape_series_async_endpoint(
    body: ScrapeEpisodesRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.url and not body.title_no:
        raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required.")

    target_url = body.url or f"https://www.webtoons.com/en/fantasy/episode/list?title_no={body.title_no}"
    assert_not_blocked(target_url)
    logger.info(f"[ScraperAPI] POST /series: target='{target_url}'")

    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    job = job_manager.create_job(
        job_type=JobType.DISCOVER_CHAPTERS,
        user_id=user_id,
        project_id=body.project_id or "Comic Series",
        metadata={"url": target_url}
    )

    async def _chapters_coro(report_progress):
        report_progress(10.0, JobStage.ANALYZING_URL.value)
        report_progress(30.0, JobStage.FETCHING.value)
        result = await scrape_series_chapters_advanced(
            series_url=target_url,
            title_no=body.title_no,
            max_chapters=body.max_episodes if (body.max_episodes and body.max_episodes > 0) else None,
            sort_by=body.sort_by or "latest",
            page=body.page or 1,
            per_page=body.per_page or 100,
            include_ratings=body.include_ratings if body.include_ratings is not None else False,
            bypass_cache=body.bypass_cache or False,
        )
        if not result.get("success") and result.get("error"):
            raise Exception(result.get("error") or "Series scraping failed.")
        report_progress(100.0, JobStage.COMPLETED.value)
        return result

    job_manager.run_in_background(job.job_id, _chapters_coro)
    return job.to_status_response()


@router.post(
    "/series/sync",
    summary="Discover series episodes & metadata (Direct Synchronous)"
)
async def scrape_series_sync_endpoint(
    body: ScrapeEpisodesRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.url and not body.title_no:
        raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required.")

    target_url = body.url or f"https://www.webtoons.com/en/fantasy/episode/list?title_no={body.title_no}"
    assert_not_blocked(target_url)
    logger.info(f"[ScraperAPI] POST /series/sync: target='{target_url}'")

    result = await scrape_series_chapters_advanced(
        series_url=target_url,
        title_no=body.title_no,
        max_chapters=body.max_episodes if (body.max_episodes and body.max_episodes > 0) else None,
        sort_by=body.sort_by or "latest",
        page=body.page or 1,
        per_page=body.per_page or 100,
        include_ratings=body.include_ratings if body.include_ratings is not None else False,
        bypass_cache=body.bypass_cache or False,
    )
    logger.debug(f"[ScraperAPI] POST /series/sync: {len(result.get('chapters', []))} chapters found")
    return result


@router.get(
    "/series/sync",
    summary="Discover series chapters via GET query parameter"
)
async def scrape_series_sync_get(
    url: str = Query(..., description="Target series URL"),
    sort_by: str = Query("latest", description="Sort order: latest or oldest"),
    max_chapters: Optional[int] = Query(None, description="Max chapters to return"),
    max_episodes: Optional[int] = Query(None, description="Max chapters alias"),
    current_user: dict = Depends(get_current_user)
):
    target_url = url.strip()
    assert_not_blocked(target_url)
    logger.info(f"[ScraperAPI] GET /series/sync: target='{target_url}'")
    limit = max_chapters or max_episodes
    result = await scrape_series_chapters_advanced(
        series_url=target_url,
        sort_by=sort_by,
        max_chapters=limit
    )
    return result


@router.post(
    "/batch",
    response_model=JobStatusResponse,
    summary="Submit background batch chapter scraping job",
    description="Submits a background BATCH_SCRAPE Job to scrape multiple chapter URLs sequentially with progress tracking."
)
async def scrape_batch_endpoint(
    body: BatchScrapeRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty.")

    logger.debug(f"[ScraperAPI] POST /batch: {len(body.urls)} URLs queued")
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    job = job_manager.create_job(
        job_type=JobType.BATCH_SCRAPE,
        user_id=user_id,
        project_id=body.project_id or "Batch Comic Scrape",
        metadata={"urls_count": len(body.urls)}
    )

    async def _batch_coro(report_progress):
        report_progress(10.0, JobStage.FETCHING.value)
        total = len(body.urls)
        results = []
        for idx, raw_url in enumerate(body.urls):
            progress = 10.0 + (80.0 * (idx / total))
            report_progress(progress, JobStage.FETCHING.value)
            parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
            res = await AdaptiveScraperEngine.scrape_url(
                url=raw_url.strip(),
                cookies=parsed_cookies,
                headers=body.headers,
                bypass_cache=body.bypass_cache or False,
                limit=body.limit,
                proxy_images=body.proxy_images if body.proxy_images is not None else True,
                filter_banners=body.filter_banners if body.filter_banners is not None else True,
                project_id=body.project_id,
                job_id=job.job_id
            )
            results.append(res.model_dump())
        report_progress(100.0, JobStage.COMPLETED.value)
        return {"success": True, "total_urls": len(body.urls), "results": results}

    job_manager.run_in_background(job.job_id, _batch_coro)
    return job.to_status_response()
