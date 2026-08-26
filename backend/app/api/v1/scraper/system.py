"""
backend/app/api/v1/scraper/system.py
─────────────────────────────────────────────────────────────────────────────
Adapter registry, system health, and project ingestion endpoints.
GET  /adapters           – List all registered site/CMS adapters
GET  /health             – Scraper engine health check & RAM cache status
POST /import-to-project  – Scrape and save directly into SQLite database
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, Depends

from api.dependencies.auth import get_current_user
from schemas.scraper import (
    ScrapeChapterRequest,
    AdapterMetaResponse,
    AdaptersListResponse,
    ScraperHealthResponse,
)
from services.scraper.adapters.site_adapter_registry import AdapterRegistry
from services.scraper.scraper_cache_manager import ScraperCacheManager
from services.scraper.scraper_service import scrape_and_initialize_project
from services.jobs import job_manager

logger = logging.getLogger("sonikoma.api.scraper.system")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get(
    "/adapters",
    response_model=AdaptersListResponse,
    summary="List all registered site and CMS adapters"
)
async def list_adapters_endpoint(
    current_user: dict = Depends(get_current_user)
):
    """
    Returns metadata for every registered site adapter: name, description,
    supported domains, speed rating, and capability flags.
    """
    raw_meta = AdapterRegistry.get_all_adapters_meta()
    adapters = [
        AdapterMetaResponse(
            adapter_id=m.get("adapter_id", m.get("name", "").lower().replace(" ", "_")),
            name=m.get("name", "Unknown Adapter"),
            description=m.get("description", ""),
            badge=m.get("badge", "Adapter"),
            speed=m.get("speed", "Normal"),
            supported_domains=m.get("supported_domains", []),
            supports_series_discovery=m.get("supports_series_discovery", True),
            supports_chapter_scraping=m.get("supports_chapter_scraping", True)
        )
        for m in raw_meta
    ]
    return AdaptersListResponse(total=len(adapters), adapters=adapters)


@router.get(
    "/health",
    response_model=ScraperHealthResponse,
    summary="Scraper engine health check & RAM cache status"
)
async def scraper_health_endpoint():
    """
    Returns the overall scraper health status: cache sizes,
    active background job count, and engine version.
    Does not require authentication so it can be polled by monitoring.
    """
    active_jobs_count = 0
    try:
        if hasattr(job_manager, "get_active_jobs"):
            active_jobs_count = len(job_manager.get_active_jobs())
    except Exception:
        pass

    return ScraperHealthResponse(
        status="healthy",
        version="2.0.0",
        in_memory_l1_cache_size=len(getattr(ScraperCacheManager, "_mem_l1", {})),
        in_memory_l5_cache_size=len(getattr(ScraperCacheManager, "_mem_l5", {})),
        active_browser_pool_workers=0,
        active_in_flight_jobs=active_jobs_count
    )


@router.post(
    "/import-to-project",
    summary="Direct Project Ingestion: Scrape and save into SQLite database"
)
async def import_to_project_endpoint(
    body: ScrapeChapterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Scrapes chapter images and saves permanent SQLite project, chapter, and
    panel records. Only called when the user explicitly clicks
    'Import to Project' or 'Save Project'.
    """
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    target_url = body.url.strip()
    logger.info(f"[Scraper System] Importing '{target_url}' to project (user='{user_id}', project_id='{body.project_id}')")
    result = await scrape_and_initialize_project(
        url=target_url,
        user_id=user_id,
        project_id=body.project_id,
        limit=body.limit,
        bypass_cache=body.bypass_cache or False
    )
    if result.get("success"):
        logger.info(f"[Scraper System] Successfully imported '{target_url}' into project '{result.get('project_id')}'")
    else:
        logger.warning(f"[Scraper System] Project import failed for '{target_url}': {result.get('error')}")
    return result
