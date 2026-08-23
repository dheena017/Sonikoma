"""
backend/app/api/v1/scraper.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Canonical Scraper API Endpoints.
Exposes modular, dedicated REST routes for:
  1. URL Intelligence & Tools (/separate-url, /normalize-url, /parent-series-url, /detect-platform)
  2. Chapter Image Scraping (/chapter, /chapter/sync, /chapter/metadata)
  3. Technology-Specific Discovery (/all-images, /discover/html-dom, /discover/javascript-state, /discover/network-traffic, /discover/css-backgrounds, /discover/api-manifest)
  4. Series & Episode Discovery (/series, /series/sync, /series/metadata, /series/episodes)
  5. Batch Crawlers (/batch, /batch-series)
  6. Validation & Sorting Tools (/validate-images, /sort-images)
  7. In-Memory Domain Blocking (/block-domain, /blocked-domains, /check-blocked)
  8. In-Memory Session & Cache (/session, /cache/clear)
  9. Adapters & Health (/adapters, /health)
  10. Project Ingestion (/import-to-project)
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional, Dict, Any, List
from urllib.parse import urlparse, quote
from fastapi import APIRouter, HTTPException, Depends, Query

from app.core.logging import logger
from api.dependencies.auth import get_current_user, get_optional_current_user
from schemas.scraper import (
    # Chapter DTOs
    ScrapeChapterRequest,
    ChapterResult,
    
    # Series DTOs
    ScrapeSeriesRequest,
    ScrapeEpisodesRequest,
    
    # Batch DTOs
    BatchScrapeRequest,
    
    # Raw Image Discovery DTOs
    ScrapeAllImagesRequest,
    ScrapeAllImagesResponse,
    RawImageItem,
    
    # URL Tools DTOs
    SeparateUrlRequest,
    SeparateUrlResponse,
    
    # Validation & Sorting DTOs
    ValidateImagesRequest,
    ValidateImagesResponse,
    SortImagesRequest,
    SortImagesResponse,
    
    # Domain Blocking DTOs
    BlockDomainRequest,
    BlockDomainResponse,
    BlockedDomainsListResponse,
    CheckBlockedResponse,
    
    # Telemetry & Adapter DTOs
    AdapterMetaResponse,
    AdaptersListResponse,
    ScraperHealthResponse,
    
    # Session DTOs
    SaveScrapedImagesRequest,
    SessionUpdatePayload,
    SessionStateResponse,
)

from services.scraper.scraper_engine import AdaptiveScraperEngine, adaptive_scraper_engine
from services.scraper.url_utils import UrlNormalizer, UniversalUrlSeparator, SiteAnalyzer
from services.scraper.domain_rate_limiter import domain_block_manager
from services.scraper.scraper_cache_manager import ScraperCacheManager
from services.scraper.adapters.site_adapter_registry import AdapterRegistry
from services.scraper.acquisition.http_page_fetcher import HttpFetcher
from services.scraper.acquisition.browser_page_fetcher import BrowserFetcher
from services.scraper.extraction.html_dom_extractor import DomExtractor
from services.scraper.extraction.embedded_state_extractor import EmbeddedStateExtractor
from services.scraper.content_validator import ImageValidator
from services.scraper.image_order_resolver import OrderResolver
from services.scraper.scraper_service import scrape_and_initialize_project
from services.scraper.scraper_workflow import (
    scrape_series_chapters,
    scrape_series_chapters_advanced,
    batch_scrape_chapters_with_checkpoint
)
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse
from repositories.scraper import save_scrape_session, get_scrape_session, delete_scrape_session

logger = logging.getLogger("sonikoma.api.scraper")
scraper_router = APIRouter()
router = scraper_router


def parse_cookie_string(raw: Optional[str]) -> Optional[Dict[str, str]]:
    """Helper to parse a standard HTTP cookie header string into a key-value dictionary."""
    if not raw:
        return None
    cookies = {}
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk or "=" not in chunk:
            continue
        name, value = chunk.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"')
        if name:
            cookies[name] = value
    return cookies if cookies else None


# =============================================================================
# 1. URL INTELLIGENCE & DECOMPOSITION ENDPOINTS
# =============================================================================

@router.post(
    "/separate-url",
    response_model=SeparateUrlResponse,
    summary="Decompose & separate any comic URL into constituent parts",
    description="Analyzes any raw comic/manga/webtoon URL and extracts its parent series URL, chapter URL, domain, platform, slugs, numbers, and recommended actions."
)
async def separate_url_post(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    if not payload.url or not payload.url.strip():
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")
    logger.debug(f"[ScraperAPI] POST /separate-url: target='{payload.url}'")
    result = UniversalUrlSeparator.separate(payload.url)
    logger.debug(f"[ScraperAPI] Separate result: platform={result.get('platform')}, is_chapter={result.get('is_chapter_url')}, series_slug={result.get('series_slug')}")
    return SeparateUrlResponse(**result)


@router.get(
    "/separate-url",
    response_model=SeparateUrlResponse,
    summary="Decompose & separate any comic URL via query parameter"
)
async def separate_url_get(
    url: str = Query(..., description="Target comic web URL"),
    current_user: dict = Depends(get_current_user)
):
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="Target URL parameter 'url' cannot be empty.")
    logger.debug(f"[ScraperAPI] GET /separate-url: target='{url}'")
    result = UniversalUrlSeparator.separate(url)
    logger.debug(f"[ScraperAPI] Separate result: platform={result.get('platform')}, is_chapter={result.get('is_chapter_url')}, series_slug={result.get('series_slug')}")
    return SeparateUrlResponse(**result)


@router.post(
    "/normalize-url",
    summary="Normalize URL and strip tracking parameters",
    description="Strips utm_source, fbclid, session tokens, and cleans trailing slashes."
)
async def normalize_url_endpoint(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.debug(f"[ScraperAPI] POST /normalize-url: target='{payload.url}'")
    normalized = UrlNormalizer.normalize_url(payload.url)
    return {"original_url": payload.url, "normalized_url": normalized}


@router.post(
    "/parent-series-url",
    summary="Resolve parent series catalog URL from chapter link"
)
async def resolve_parent_series_endpoint(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.debug(f"[ScraperAPI] POST /parent-series-url: target='{payload.url}'")
    parent = UrlNormalizer.resolve_parent_series_url(payload.url)
    return {"chapter_url": payload.url, "parent_series_url": parent}


@router.post(
    "/detect-platform",
    summary="Detect comic platform and matching adapter"
)
async def detect_platform_endpoint(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.debug(f"[ScraperAPI] POST /detect-platform: target='{payload.url}'")
    source_info = SiteAnalyzer.analyze(payload.url)
    adapter = AdapterRegistry.get_adapter(source_info)
    sep_data = UniversalUrlSeparator.separate(payload.url)
    logger.debug(f"[ScraperAPI] Detected platform: {source_info.platform} -> adapter: {adapter.__class__.__name__}")
    return {
        "url": payload.url,
        "domain": source_info.domain,
        "platform": source_info.platform,
        "adapter_name": adapter.__class__.__name__,
        "is_chapter": source_info.is_chapter_url,
        "chapter_number": sep_data.get("chapter_number")
    }


# =============================================================================
# 2. CHAPTER PANEL EXTRACTION ENDPOINTS
# =============================================================================

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
    logger.info(f"[ScraperAPI] POST /chapter: url='{target_url}', force_refresh={body.force_refresh}, bypass_cache={body.bypass_cache}")
    if domain_block_manager.is_blocked(target_url):
        domain = urlparse(target_url).netloc or target_url
        logger.warning(f"[ScraperAPI] Blocked domain rejected: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )

    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    job = job_manager.create_job(
        job_type=JobType.SCRAPE_CHAPTER,
        user_id=user_id,
        project_id=body.project_id or "Comic Chapter",
        chapter_id=body.chapter_id,
        metadata={"url": target_url}
    )
    logger.debug(f"[ScraperAPI] Created async scrape job: {job.job_id} for user: {user_id}")

    clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
    parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
    bypass = True if body.force_refresh else (body.bypass_cache or False)

    async def _scrape_coro(report_progress):
        logger.debug(f"[ScraperAPI] Starting execution of scrape job: {job.job_id}")
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

        logger.debug(f"[ScraperAPI] Scrape job {job.job_id} extracted {len(result.images)} images (series: '{result.series.title if result.series else 'N/A'}')")
        if result.series and result.series.title:
            job.project_id = result.series.title
        if result.chapter and (result.chapter.title or result.chapter.number is not None):
            ch_title = result.chapter.title or f"Episode {result.chapter.number}"
            job.chapter_id = ch_title

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
    current_user: dict = Depends(get_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required.")

    target_url = body.url.strip()
    logger.info(f"[ScraperAPI] POST /chapter/sync: url='{target_url}'")
    if domain_block_manager.is_blocked(target_url):
        domain = urlparse(target_url).netloc or target_url
        logger.warning(f"[ScraperAPI] Blocked domain rejected: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )

    clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
    parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
    bypass = True if body.force_refresh else (body.bypass_cache or False)

    result = await AdaptiveScraperEngine.scrape_url(
        url=body.url.strip(),
        cookies=parsed_cookies,
        headers=clean_headers,
        bypass_cache=bypass,
        limit=body.limit,
        proxy_images=body.proxy_images if body.proxy_images is not None else True,
        filter_banners=body.filter_banners if body.filter_banners is not None else True,
        project_id=body.project_id
    )
    logger.debug(f"[ScraperAPI] Synchronous scrape completed: {len(result.images)} panels returned")
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
    current_user: dict = Depends(get_current_user)
):
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="URL query parameter is required.")

    result = await AdaptiveScraperEngine.scrape_url(
        url=url.strip(),
        proxy_images=proxy_images,
        filter_banners=filter_banners
    )
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
        proxied_u = f"/api/proxy-image?url={quote(raw_u, safe='')}&referer={quote(target_url, safe='')}"
        panels.append({
            "index": idx,
            "url": raw_u,
            "proxied_url": proxied_u,
            "width": getattr(img, "width", None),
            "height": getattr(img, "height", None)
        })

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
        proxied_u = f"/api/proxy-image?url={quote(raw_u, safe='')}&referer={quote(target_url, safe='')}"
        panels.append({
            "index": idx,
            "url": raw_u,
            "proxied_url": proxied_u,
            "width": getattr(img, "width", None),
            "height": getattr(img, "height", None)
        })

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


# =============================================================================
# 3. RAW / UNFILTERED ALL-IMAGES EXTRACTION ENDPOINTS
# =============================================================================

@router.post(
    "/all-images",
    response_model=ScrapeAllImagesResponse,
    summary="Scrape ALL images from any URL (Unfiltered / Zero Rejection)",
    description="Scrapes every single image asset on the page completely unfiltered without rejecting banners, logos, or icons."
)
@router.post("/discover/all", response_model=ScrapeAllImagesResponse, include_in_schema=False)
@router.post("/raw-images", response_model=ScrapeAllImagesResponse, include_in_schema=False)
async def scrape_all_images_post(
    body: ScrapeAllImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")

    return await AdaptiveScraperEngine.extract_all_raw_images(
        url=body.url.strip(),
        render_js=body.render_js,
        bypass_cache=body.bypass_cache,
        include_backgrounds=body.include_backgrounds,
        include_svg=body.include_svg,
        cookies=body.cookies,
        headers=body.headers
    )


@router.get(
    "/all-images",
    response_model=ScrapeAllImagesResponse,
    summary="Scrape ALL images via GET query parameter"
)
@router.get("/discover/all", response_model=ScrapeAllImagesResponse, include_in_schema=False)
async def scrape_all_images_get(
    url: str = Query(..., description="Target URL to scrape all images from"),
    render_js: bool = Query(True, description="Render page in headless browser for dynamic images"),
    include_backgrounds: bool = Query(True, description="Include CSS background images"),
    include_svg: bool = Query(False, description="Include SVG vector assets"),
    current_user: dict = Depends(get_current_user)
):
    if not url or not url.strip():
        raise HTTPException(status_code=400, detail="URL query parameter is required.")

    return await AdaptiveScraperEngine.extract_all_raw_images(
        url=url.strip(),
        render_js=render_js,
        include_backgrounds=include_backgrounds,
        include_svg=include_svg
    )


# ─── Granular Technology-Specific Discovery Routes ─────────────────────────

@router.post(
    "/discover/html-dom",
    summary="Discover static HTML DOM images only (<img>, data-src, srcset)"
)
async def discover_html_dom_endpoint(
    body: ScrapeAllImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    html, _, _ = await HttpFetcher.fetch_html(body.url)
    if not html:
        raise HTTPException(status_code=400, detail="Could not fetch HTML.")
    soup = DomExtractor.get_soup(html)
    candidates = DomExtractor.extract_manga_images_fallback(soup, body.url) if soup else []
    return {
        "url": body.url,
        "technology": "static_html_dom",
        "total_images": len(candidates),
        "images": [{"index": i, "url": c.url, "source": c.source_type.value} for i, c in enumerate(candidates)]
    }


@router.post(
    "/discover/javascript-state",
    summary="Discover images inside JavaScript AST objects (__NEXT_DATA__, window.__DATA__)"
)
async def discover_js_state_endpoint(
    body: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    html, _, _ = await HttpFetcher.fetch_html(body.url)
    if not html:
        raise HTTPException(status_code=400, detail="Could not fetch HTML.")
    state_candidates = EmbeddedStateExtractor.extract_from_html(html, body.url)
    return {
        "url": body.url,
        "technology": "javascript_embedded_state",
        "total_images": len(state_candidates),
        "images": [{"index": i, "url": c.url, "source": c.source_type.value} for i, c in enumerate(state_candidates)]
    }


@router.post(
    "/discover/network-traffic",
    summary="Discover images via Playwright live network packet interception"
)
async def discover_network_traffic_endpoint(
    body: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    res = await BrowserFetcher.render_page(body.url, auto_scroll=True)
    net_images = res.get("network_images", []) if res else []
    return {
        "url": body.url,
        "technology": "browser_network_interception",
        "total_images": len(net_images),
        "images": net_images
    }


# =============================================================================
# 4. SERIES & EPISODE DISCOVERY ENDPOINTS
# =============================================================================

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
    logger.info(f"[ScraperAPI] POST /series: target='{target_url}', title_no={body.title_no}, sort_by={body.sort_by}")

    if domain_block_manager.is_blocked(target_url):
        domain = urlparse(target_url).netloc or target_url
        logger.warning(f"[ScraperAPI] Blocked domain rejected for series discovery: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )

    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    job = job_manager.create_job(
        job_type=JobType.DISCOVER_CHAPTERS,
        user_id=user_id,
        project_id=body.project_id or "Comic Series",
        metadata={"url": target_url}
    )
    logger.debug(f"[ScraperAPI] Created series discovery job: {job.job_id}")

    async def _chapters_coro(report_progress):
        logger.debug(f"[ScraperAPI] Executing series discovery job: {job.job_id}")
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

        total_ch = len(result.get("chapters", []))
        logger.debug(f"[ScraperAPI] Series discovery job {job.job_id} found {total_ch} chapters (title: '{result.get('series_title')}')")

        if not result.get("success") and result.get("error"):
            logger.error(f"[ScraperAPI] Series discovery job {job.job_id} failed: {result.get('error')}")
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
    logger.info(f"[ScraperAPI] POST /series/sync: target='{target_url}', title_no={body.title_no}")
    if domain_block_manager.is_blocked(target_url):
        domain = urlparse(target_url).netloc or target_url
        logger.warning(f"[ScraperAPI] Blocked domain rejected for series discovery: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )

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
    logger.debug(f"[ScraperAPI] Sync series discovery completed: {len(result.get('chapters', []))} chapters found")
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
    logger.info(f"[ScraperAPI] GET /series/sync: target='{target_url}'")
    if domain_block_manager.is_blocked(target_url):
        domain = urlparse(target_url).netloc or target_url
        logger.warning(f"[ScraperAPI] Blocked domain rejected for series discovery: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )

    limit = max_chapters or max_episodes
    result = await scrape_series_chapters_advanced(
        series_url=target_url,
        sort_by=sort_by,
        max_chapters=limit
    )
    logger.debug(f"[ScraperAPI] Sync GET series discovery completed: {len(result.get('chapters', []))} chapters found")
    return result


# =============================================================================
# 5. BATCH SCRAPER ENDPOINTS
# =============================================================================

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
        return {
            "success": True,
            "total_urls": len(body.urls),
            "results": results
        }

    job_manager.run_in_background(job.job_id, _batch_coro)
    return job.to_status_response()


# =============================================================================
# 6. IMAGE VALIDATION & READING ORDER TOOLS
# =============================================================================

@router.post(
    "/validate-images",
    response_model=ValidateImagesResponse,
    summary="Validate and filter candidate image URLs"
)
async def validate_images_endpoint(
    body: ValidateImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    accepted, rejections = ImageValidator.validate_candidates(
        candidates=body.images,  # type: ignore
        filter_banners=body.filter_banners
    )
    return ValidateImagesResponse(
        success=True,
        valid_count=len(accepted),
        rejected_count=len(rejections),
        images=[img.model_dump() for img in accepted],
        rejected=rejections
    )


@router.post(
    "/sort-images",
    response_model=SortImagesResponse,
    summary="Naturally sort and re-index image URLs into sequential reading order"
)
async def sort_images_endpoint(
    body: SortImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    sorted_imgs = OrderResolver.resolve_order(body.images)
    return SortImagesResponse(
        success=True,
        total_images=len(sorted_imgs),
        images=[img.model_dump() if hasattr(img, "model_dump") else img for img in sorted_imgs]
    )


# =============================================================================
# 7. IN-MEMORY DOMAIN BLOCKING SYSTEM
# =============================================================================

@router.post(
    "/block-domain",
    response_model=BlockDomainResponse,
    summary="Block a domain or URL pattern from scraping"
)
async def block_domain_endpoint(
    body: BlockDomainRequest,
    current_user: dict = Depends(get_current_user)
):
    blocked_domain = domain_block_manager.block_domain(body.domain, reason=body.reason or "Blocked by user")
    return BlockDomainResponse(
        success=bool(blocked_domain),
        domain=body.domain,
        status="blocked",
        message=f"Domain '{body.domain}' added to blocklist."
    )


@router.delete(
    "/block-domain/{domain}",
    summary="Unblock a domain, restoring scraping access"
)
async def unblock_domain_endpoint(
    domain: str,
    current_user: dict = Depends(get_current_user)
):
    success = domain_block_manager.unblock_domain(domain)
    return {
        "success": success,
        "domain": domain,
        "message": f"Domain '{domain}' removed from blocklist."
    }


@router.get(
    "/blocked-domains",
    response_model=BlockedDomainsListResponse,
    summary="List all currently blocked domains and patterns"
)
async def list_blocked_domains_endpoint(
    current_user: dict = Depends(get_current_user)
):
    blocked = domain_block_manager.get_all_blocked()
    return BlockedDomainsListResponse(total=len(blocked), blocked_domains=blocked)


@router.post(
    "/check-blocked",
    response_model=CheckBlockedResponse,
    summary="Pre-check if a URL or domain is blocked before scraping"
)
async def check_blocked_endpoint(
    payload: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    is_blk = domain_block_manager.is_blocked(payload.url)
    domain = urlparse(payload.url).netloc
    return CheckBlockedResponse(
        url=payload.url,
        domain=domain,
        is_blocked=is_blk,
        reason="Domain is in active exclusion list" if is_blk else None
    )


# =============================================================================
# 8. IN-MEMORY SESSION & CACHE MANAGEMENT
# =============================================================================

@router.get(
    "/session",
    summary="Get active session panel list for a URL"
)
async def get_session_endpoint(
    url: str = Query(..., description="Source URL of active session"),
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(url)
    session_data = get_scrape_session(extracted_url)
    return {"url": url, "session": session_data}


@router.put(
    "/session",
    summary="Update active session panel list"
)
async def update_session_cache_endpoint(
    body: SaveScrapedImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(body.url)
    save_scrape_session(extracted_url, body.images)
    return {"success": True, "project_id": body.project_id}


@router.delete(
    "/session",
    summary="Clear active session cache for a URL"
)
async def delete_session_endpoint(
    url: str = Query(..., description="Source URL of session to clear"),
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(url)
    delete_scrape_session(extracted_url)
    return {"success": True, "message": "Session cleared."}


@router.post(
    "/cache/clear",
    summary="Flush in-memory RAM caches"
)
async def clear_cache_endpoint(
    current_user: dict = Depends(get_current_user)
):
    ScraperCacheManager.clear()
    return {"success": True, "message": "In-memory scraper cache flushed."}


# =============================================================================
# 9. ADAPTERS REGISTRY & SYSTEM HEALTH
# =============================================================================

@router.get(
    "/adapters",
    response_model=AdaptersListResponse,
    summary="List all registered site and CMS adapters"
)
async def list_adapters_endpoint(
    current_user: dict = Depends(get_current_user)
):
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
    active_jobs_count = 0
    try:
        if hasattr(job_manager, "get_active_jobs"):
            active_jobs_count = len(job_manager.get_active_jobs())
    except Exception:
        active_jobs_count = 0

    return ScraperHealthResponse(
        status="healthy",
        version="2.0.0",
        in_memory_l1_cache_size=len(getattr(ScraperCacheManager, "_mem_l1", {})),
        in_memory_l5_cache_size=len(getattr(ScraperCacheManager, "_mem_l5", {})),
        active_browser_pool_workers=0,
        active_in_flight_jobs=active_jobs_count
    )


# =============================================================================
# 10. DIRECT PROJECT INGESTION & PERMANENT SAVING
# =============================================================================

@router.post(
    "/import-to-project",
    summary="Direct Project Ingestion: Scrape and save into SQLite database"
)
async def import_to_project_endpoint(
    body: ScrapeChapterRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Scrapes chapter images and saves permanent SQLite project, chapter, and panels records.
    Only called when the user explicitly clicks 'Import to Project' or 'Save Project'.
    """
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    return await scrape_and_initialize_project(
        url=body.url.strip(),
        user_id=user_id,
        project_id=body.project_id,
        limit=body.limit,
        bypass_cache=body.bypass_cache or False
    )
