"""
backend/app/api/v1/scraper.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Scraper API endpoints (Canonical 4 REST Routes).
Exposes chapter scraping, series/episode discovery, batch processing, and session cache.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from schemas.scraper import (
    ScrapeChapterRequest,
    ScrapeEpisodesRequest,
    BatchScrapeRequest,
    SaveScrapedImagesRequest,
    ScraperAIAnalyzeRequest,
    ScraperAIAnalyzeResponse,
    DomainRecord,
    DomainListResponse,
    DomainUpdateRequest,
    DomainRequestSubmission,
)
from services.scraper.engine import AdaptiveScraperEngine
from services.scraper.normalizer import UrlNormalizer
from services.scraper.models import ChapterResult
from services.scraper.ai.domain_memory import DomainMemory
from services.scraper.ai.orchestrator_scraper import ScraperAIOrchestrator, UniversalComicBlueprint
from services.scraper.acquisition.http import HttpFetcher
from services.scraper.acquisition.browser import BrowserFetcher
from services.scraper.workflow import scrape_webtoon_episodes_advanced
from services.jobs import job_manager, JobType, JobStage, JobStatusResponse
from repositories.scraper import save_scrape_session

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


# ─── 1. Canonical Single Chapter Scraper ─────────────────────────────────────

@router.post(
    "/chapter",
    response_model=JobStatusResponse,
    summary="Scrape single chapter URL via AdaptiveScraperEngine",
    description="Submits a background SCRAPE_CHAPTER Job that discovers, filters, and downloads comic panels for 1 chapter URL."
)
async def scrape_chapter_endpoint(
    body: ScrapeChapterRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required and cannot be empty.")
    try:
        user_id = current_user["user_id"]
        logger.info(f"[Scraper Route] Creating SCRAPE_CHAPTER job: url={body.url!r}, user_id={user_id}, project_id={body.project_id}")

        # Extract initial chapter identifier from request or URL query/path
        initial_chapter_id = body.chapter_id
        if not initial_chapter_id:
            import re
            from urllib.parse import urlparse, parse_qs
            u_str = body.url.strip()
            parsed_u = urlparse(u_str)
            q = parse_qs(parsed_u.query)
            if "episode_no" in q:
                initial_chapter_id = f"Episode {q['episode_no'][0]}"
            elif "chapter" in q:
                initial_chapter_id = f"Chapter {q['chapter'][0]}"
            elif "ep" in q:
                initial_chapter_id = f"Episode {q['ep'][0]}"
            elif "ch" in q:
                initial_chapter_id = f"Chapter {q['ch'][0]}"
            else:
                # Path-based match across all comic site conventions (e.g. /chapter/1, /ep-11, /c10, /chapter-5)
                m = re.search(r'/(?:chapter|episode|ep|ch|c)[/-](\d+(?:\.\d+)?)\b', parsed_u.path, re.IGNORECASE)
                if m:
                    initial_chapter_id = f"Chapter {m.group(1)}"

        # Derive human-friendly project context name
        initial_project_name = body.project_id
        if not initial_project_name or initial_project_name.startswith("temp_"):
            # Extract title from URL (e.g. /fantasy/tower-of-god/... -> "Tower Of God")
            path_segments = [seg for seg in parsed_u.path.strip("/").split("/") if seg and not re.match(r'^(?:comic|chapter|episode|ep|ch|c|viewer|\d+)$', seg, re.IGNORECASE)]
            if path_segments:
                slug_candidate = path_segments[-1]
                initial_project_name = slug_candidate.replace("-", " ").replace("_", " ").title()
            else:
                domain_parts = parsed_u.netloc.split(".")
                initial_project_name = f"{domain_parts[1].title() if len(domain_parts) > 1 else 'Comic'} Chapter"

        job = job_manager.create_job(
            job_type=JobType.SCRAPE_CHAPTER,
            user_id=user_id,
            project_id=initial_project_name,
            chapter_id=initial_chapter_id,
            metadata={"url": body.url.strip()}
        )

        clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
        clean_cookies = None if (not body.cookies or body.cookies.strip().lower() in ("string", "nul", "null", "none", "undefined")) else body.cookies
        parsed_cookies = parse_cookie_string(clean_cookies) if clean_cookies else None
        bypass = True if body.force_refresh else (body.bypass_cache or False)

        async def _scrape_coro(report_progress):
            report_progress(10.0, JobStage.ANALYZING_URL.value)
            report_progress(30.0, JobStage.FETCHING.value)

            result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
                url=body.url.strip(),
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
                ch_title = result.chapter.title or f"Episode {result.chapter.number}"
                job.chapter_id = ch_title

            report_progress(100.0, JobStage.COMPLETED.value)
            return result.model_dump()

        job_manager.run_in_background(job.job_id, _scrape_coro)
        return job.to_status_response()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Canonical Scraper Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 2. Canonical Series & Episode Discovery ─────────────────────────────────

@router.post(
    "/series",
    response_model=JobStatusResponse,
    summary="Scrape series episodes & metadata",
    description="Submits a background DISCOVER_EPISODES Job to crawl comic chapter lists, ratings, pagination, and release dates."
)
async def scrape_series_endpoint(
    body: ScrapeEpisodesRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        if not body.url and not body.title_no:
            raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required")

        logger.info(f"[Routes] Creating DISCOVER_EPISODES job: url={body.url}, title_no={body.title_no}")

        job = job_manager.create_job(
            job_type=JobType.DISCOVER_EPISODES,
            user_id=current_user["user_id"],
            project_id=body.project_id,
            metadata={"url": body.url, "title_no": body.title_no}
        )

        async def _episodes_coro(report_progress):
            report_progress(10.0, JobStage.ANALYZING_URL.value)
            report_progress(30.0, JobStage.FETCHING.value)

            if body.url:
                target_url = body.url
            elif body.title_no:
                target_url = f"https://www.webtoons.com/en/fantasy/episode/list?title_no={body.title_no}"
            else:
                raise Exception("Either url or title_no must be provided for episode discovery.")

            result = await scrape_webtoon_episodes_advanced(
                series_url=target_url,
                title_no=body.title_no,
                max_episodes=body.max_episodes or 50,
                sort_by=body.sort_by or "latest",
                page=body.page or 1,
                include_ratings=body.include_ratings if body.include_ratings is not None else False,
                bypass_cache=body.bypass_cache if body.bypass_cache is not None else False,
            )

            if not result.get("success") and result.get("error"):
                raise Exception(result.get("error") or "Series scraping failed")

            report_progress(100.0, JobStage.COMPLETED.value)
            return result

        job_manager.run_in_background(job.job_id, _episodes_coro)
        return job.to_status_response()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Scrape Series Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 3. Canonical Batch Multiple Chapters / Series Scraping ──────────────────

@router.post(
    "/batch",
    response_model=JobStatusResponse,
    summary="Submit background batch scraping job for multiple URLs",
    description="Submits a background BATCH_SCRAPE Job to sequentially or concurrently scrape multiple chapters or series."
)
async def scrape_batch_endpoint(
    body: BatchScrapeRequest,
    current_user: dict = Depends(get_current_user)
):
    if not body.urls:
        raise HTTPException(status_code=400, detail="Urls list cannot be empty.")

    try:
        user_id = current_user["user_id"]
        job = job_manager.create_job(
            job_type=JobType.BATCH_SCRAPE,
            user_id=user_id,
            project_id=body.project_id,
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Batch Scrape Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 4. Canonical Session Cache Management ───────────────────────────────────

@router.put(
    "/session",
    summary="Update scraped images session cache",
    description="Persists reordered and curated comic images for an active scraping session."
)
async def update_session_cache_endpoint(body: SaveScrapedImagesRequest):
    try:
        extracted_url = UrlNormalizer.extract_first_url(body.url)
        save_scrape_session(extracted_url, body.images)
        return {"success": True, "project_id": body.project_id}
    except Exception as e:
        logger.error(f"[Scraper Session Cache Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 5. AI Comic Blueprint & Architecture Analysis ───────────────────────────

def estimate_total_chapter_images(html: Optional[str], blueprint: Optional[UniversalComicBlueprint], url: str) -> int:
    """Accurately calculates total chapter image count via state discovery, container scan, or past jobs."""
    if not blueprint:
        return 0
    if blueprint.total_estimated_pages and blueprint.total_estimated_pages > 0:
        return blueprint.total_estimated_pages

    try:
        from database.engine import get_db_connection
        with get_db_connection() as conn:
            base_u = url.split("#")[0].strip()
            rows = conn.execute(
                "SELECT result FROM jobs WHERE metadata LIKE ? AND status = 'COMPLETED' AND type = 'SCRAPE_CHAPTER' ORDER BY created_at DESC LIMIT 15",
                (f"%{base_u}%",)
            ).fetchall()
            max_imgs = 0
            for row in rows:
                if row and row["result"]:
                    import json
                    res = json.loads(row["result"])
                    if isinstance(res, dict) and "images" in res and len(res["images"]) > max_imgs:
                        max_imgs = len(res["images"])
            if max_imgs > 0:
                return max_imgs
    except Exception:
        pass

    if html:
        try:
            import re
            from bs4 import BeautifulSoup
            if blueprint.container_selector:
                soup = BeautifulSoup(html, "html.parser")
                container = soup.select_one(blueprint.container_selector)
                if container:
                    imgs = container.find_all(["img", "source", "canvas"])
                    if len(imgs) > len(blueprint.sample_image_urls):
                        return len(imgs)

            if blueprint.image_url_pattern:
                pattern = re.compile(blueprint.image_url_pattern, re.IGNORECASE)
                matches = {m.group(0) for m in pattern.finditer(html)}
                if len(matches) > len(blueprint.sample_image_urls):
                    return len(matches)
        except Exception:
            pass

    return len(blueprint.sample_image_urls) if blueprint.sample_image_urls else 0


@router.post(
    "/ai/analyze",
    response_model=ScraperAIAnalyzeResponse,
    summary="Directly test or invoke AI Scraper Intelligence on any URL or HTML",
    description="Uses Gemini 2.5 Flash to inspect comic page structure, discovering reader containers, image attributes, metadata, and JSONPath state queries in real-time."
)
async def analyze_comic_blueprint_endpoint(
    body: ScraperAIAnalyzeRequest,
    current_user: dict = Depends(get_current_user)
):
    import time
    from services.scraper.ai.orchestrator_scraper import ScraperAIOrchestrator
    from services.scraper.ai.domain_memory import DomainMemory
    from services.scraper.acquisition.http import HttpFetcher

    t0 = time.time()
    url = body.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="Target URL is required.")

    user_id = current_user.get("user_id", "guest") if current_user else "guest"

    # Create tracked Job with JobType.AI_SCRAPER_ANALYZE
    job = job_manager.create_job(
        job_type=JobType.AI_SCRAPER_ANALYZE,
        user_id=user_id,
        project_id="AI Blueprint Analysis",
        chapter_id=None,
        metadata={"url": url, "bypass_cache": body.bypass_cache}
    )
    job_manager.update_progress(job.job_id, 10.0, stage="ANALYZING_PAGE")

    # 1. Check cached domain blueprint unless bypass_cache is requested
    if not body.bypass_cache:
        cached = DomainMemory.get_blueprint(url)
        if cached:
            latency = (time.time() - t0) * 1000.0
            job_manager.complete_job(job.job_id, result=cached.model_dump())
            total_detected = estimate_total_chapter_images(body.html, cached, url)
            return ScraperAIAnalyzeResponse(
                success=True,
                job_id=job.job_id,
                url=url,
                is_cached=True,
                latency_ms=round(latency, 2),
                total_images=total_detected,
                blueprint=cached.model_dump(),
                error=None
            )

    # 2. Acquire raw HTML if not provided directly in request body or if swagger placeholder
    raw_html = body.html
    if raw_html and (raw_html.strip().lower() in ("string", "nul", "null", "none", "undefined", "{}", "test") or len(raw_html.strip()) < 40):
        raw_html = None

    clean_headers = {k: v for k, v in (body.headers or {}).items() if not k.startswith("additionalProp") and v != "string"} or None
    clean_cookies = None if (not body.cookies or body.cookies.strip().lower() in ("string", "nul", "null", "none", "undefined")) else body.cookies

    if not raw_html:
        job_manager.update_progress(job.job_id, 30.0, stage="FETCHING_HTML")
        parsed_cookies = parse_cookie_string(clean_cookies) if clean_cookies else None
        html, status_code, _ = await HttpFetcher.fetch_html(
            url=url,
            headers=clean_headers,
            cookies=parsed_cookies,
            timeout=25.0
        )
        raw_html = html

    if not raw_html:
        latency = (time.time() - t0) * 1000.0
        job_manager.fail_job(job.job_id, error_message="Could not fetch HTML content from the specified URL.")
        return ScraperAIAnalyzeResponse(
            success=False,
            job_id=job.job_id,
            url=url,
            is_cached=False,
            latency_ms=round(latency, 2),
            total_images=0,
            blueprint=None,
            error="Could not fetch HTML content from the specified URL."
        )

    # 3. Execute AI Analysis with Gemini 2.5 Flash
    try:
        job_manager.update_progress(job.job_id, 60.0, stage="GEMINI_INFERENCE")
        blueprint = await ScraperAIOrchestrator.analyze_page(raw_html, url)
        latency = (time.time() - t0) * 1000.0

        if not blueprint:
            job_manager.fail_job(job.job_id, error_message="AI Analysis did not produce a valid comic blueprint.")
            return ScraperAIAnalyzeResponse(
                success=False,
                job_id=job.job_id,
                url=url,
                is_cached=False,
                latency_ms=round(latency, 2),
                total_images=0,
                blueprint=None,
                error="AI Analysis did not produce a valid comic blueprint."
            )

        # Cache for future instant reuse
        DomainMemory.save_blueprint(url, blueprint)
        job_manager.complete_job(job.job_id, result=blueprint.model_dump())

        total_detected = estimate_total_chapter_images(raw_html, blueprint, url)
        return ScraperAIAnalyzeResponse(
            success=True,
            job_id=job.job_id,
            url=url,
            is_cached=False,
            latency_ms=round(latency, 2),
            total_images=total_detected,
            blueprint=blueprint.model_dump(),
            error=None
        )
    except Exception as e:
        latency = (time.time() - t0) * 1000.0
        logger.error(f"[AI Scraper Analyze Error] {e}", exc_info=True)
        job_manager.fail_job(job.job_id, error_message=str(e))
        return ScraperAIAnalyzeResponse(
            success=False,
            job_id=job.job_id,
            url=url,
            is_cached=False,
            latency_ms=round(latency, 2),
            blueprint=None,
            error=str(e)
        )


# =============================================================================
# ADMIN DOMAIN MANAGEMENT & APPROVAL ROUTES
# =============================================================================

@router.get(
    "/admin/domains",
    response_model=DomainListResponse,
    summary="List all scraping domain configurations and approval statuses"
)
async def list_admin_domains(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> DomainListResponse:
    """Lists registered comic domains filtered optionally by status (approved, pending, blocked)."""
    raw_domains = DomainMemory.list_domains(status=status)
    domains = [DomainRecord(**d) for d in raw_domains]
    return DomainListResponse(domains=domains, total=len(domains))


@router.post(
    "/admin/domains/request",
    summary="Submit a domain onboarding request"
)
async def submit_domain_request(
    request: DomainRequestSubmission,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Allows users or admins to request onboarding for an unapproved comic website."""
    url = UrlNormalizer.normalize_url(request.url)
    if not url:
        raise HTTPException(status_code=400, detail="Invalid comic URL provided.")

    user_email = current_user.get("email") if isinstance(current_user, dict) else "anonymous"
    domain = DomainMemory.request_domain(
        url=url,
        requested_by=user_email,
        notes=request.notes
    )
    return {
        "success": True,
        "message": f"Website domain '{domain}' has been submitted for administrator review.",
        "domain": domain,
        "status": "pending"
    }


@router.post(
    "/admin/domains/{domain}/status",
    summary="Update approval status for a domain (approved, pending, blocked)"
)
async def update_domain_status(
    domain: str,
    status_payload: DomainUpdateRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Sets a domain status to 'approved', 'pending', or 'blocked'."""
    new_status = (status_payload.status or "approved").lower()
    if new_status not in ("approved", "pending", "blocked"):
        raise HTTPException(status_code=400, detail="Status must be one of: 'approved', 'pending', 'blocked'.")

    bp = None
    if status_payload.blueprint:
        try:
            bp = UniversalComicBlueprint(**status_payload.blueprint)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid blueprint data: {e}")

    DomainMemory.set_domain_status(
        domain_or_url=domain,
        status=new_status,
        sample_url=status_payload.sample_url,
        notes=status_payload.notes,
        blueprint=bp
    )
    return {
        "success": True,
        "message": f"Domain '{domain}' updated to status '{new_status}'.",
        "domain": domain,
        "status": new_status
    }


@router.put(
    "/admin/domains/{domain}",
    summary="Update blueprint or configuration for a domain"
)
async def update_domain_blueprint(
    domain: str,
    payload: DomainUpdateRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Updates blueprint selectors, patterns, or notes for a domain."""
    bp = None
    if payload.blueprint:
        try:
            bp = UniversalComicBlueprint(**payload.blueprint)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid blueprint data: {e}")

    DomainMemory.set_domain_status(
        domain_or_url=domain,
        status=payload.status or "approved",
        sample_url=payload.sample_url,
        notes=payload.notes,
        blueprint=bp
    )
    return {
        "success": True,
        "message": f"Configuration for domain '{domain}' saved successfully.",
        "domain": domain
    }


@router.delete(
    "/admin/domains/{domain}",
    summary="Delete a domain configuration record"
)
async def delete_admin_domain(
    domain: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Deletes a domain record from memory."""
    DomainMemory.delete_domain(domain)
    return {
        "success": True,
        "message": f"Domain configuration for '{domain}' removed.",
        "domain": domain
    }

