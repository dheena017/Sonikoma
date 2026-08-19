"""
backend/app/api/v1/scraper.py
─────────────────────────────────────────────────────────────────────────────
FastAPI route controllers for Webtoon scraping. Exposes HTTP interfaces,
parses authorization tokens, and delegates logic to scraper services.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import jwt
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import Response

from api.dependencies.auth import get_all_user_keys, get_current_user
from repositories.scraper.repository import save_scrape_session
from schemas.scraper import (
    ScrapeChapterRequest,
    ScrapeImagesRequest,
    ScrapeEpisodesRequest,
    ScrapeEpisodesAdvancedRequest,
    BatchScrapeSeriesRequest,
    GenerateStoryboardRequest,
    GenerateStoryboardOnlyRequest,
    ProcessUrlRequest,
    SaveScrapedImagesRequest,
    ExtractScriptRequest,
    ExportArchiveRequest,
    BatchScrapeRequest,
    SmartSplitRequest
)
from core.security import SECRET_KEY


from services.scraper import (
    AdaptiveScraperEngine,
    ChapterResult,
    scrape_webtoon_episodes,
    scrape_webtoon_episodes_advanced,
    scrape_webtoon_episodes_paginated,
    batch_scrape_series,
    scrape_and_initialize_project,
    generate_storyboard_and_video,
    generate_storyboard_only_service,
    extract_script_from_panels,
    create_comic_archive,
    split_vertical_strip_into_panels
)
from services.scraper.normalizer import UrlNormalizer
extract_webtoon_url = UrlNormalizer.extract_first_url

ALGORITHM = "HS256"
logger = logging.getLogger("sonikoma.api.scraper")

scraper_router = APIRouter()
router = scraper_router


from services.jobs import job_manager, JobType, JobStage, JobStatus

@router.post("/chapter", summary="Scrape single chapter URL via AdaptiveScraperEngine")
async def scrape_chapter_canonical(body: ScrapeChapterRequest, current_user: dict = Depends(get_current_user)):
    """Canonical single-request chapter scraper endpoint returning a Job."""
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Chapter URL is required and cannot be empty.")
    try:
        user_id = current_user["user_id"]
        logger.info(f"[Scraper Route] Creating SCRAPE_CHAPTER job: url={body.url!r}, user_id={user_id}, project_id={body.project_id}")
        
        job = job_manager.create_job(
            job_type=JobType.SCRAPE_CHAPTER,
            user_id=user_id,
            project_id=body.project_id,
            metadata={"url": body.url.strip()}
        )
        
        parsed_cookies = parse_cookie_string(body.cookies) if body.cookies else None
        bypass = True if body.force_refresh else (body.bypass_cache or False)
        
        async def _scrape_coro(report_progress):
            report_progress(10.0, JobStage.ANALYZING_URL.value)
            report_progress(30.0, JobStage.FETCHING.value)
            
            result: ChapterResult = await AdaptiveScraperEngine.scrape_url(
                url=body.url.strip(),
                cookies=parsed_cookies,
                headers=body.headers,
                bypass_cache=bypass,
                limit=body.limit,
                proxy_images=body.proxy_images if body.proxy_images is not None else True,
                filter_banners=body.filter_banners if body.filter_banners is not None else True,
                project_id=body.project_id,
                job_id=job.job_id
            )
            
            if not result.success and result.error:
                raise Exception(result.error.message or "Scraping failed")
                
            report_progress(100.0, JobStage.COMPLETED.value)
            return result.model_dump()

        job_manager.run_in_background(job.job_id, _scrape_coro)
        return job.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Canonical Scraper Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


def parse_cookie_string(cookie_string: Optional[str]) -> Optional[Dict[str, str]]:
    if not cookie_string:
        return None

    cookies: Dict[str, str] = {}
    for pair in cookie_string.split(";"):
        if not pair:
            continue
        parts = pair.split("=", 1)
        if len(parts) != 2:
            continue
        name, value = parts[0].strip(), parts[1].strip()
        if name:
            cookies[name] = value

    return cookies if cookies else None


def get_optional_user_id(request: Request) -> Optional[str]:
    """Decodes optional bearer authorization token to extract sub (user_id)."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except Exception:
        return None


@router.post("/scrape-images", summary="Scrape comic panels from Webtoon URL (Legacy bridge)")
async def scrape_images(request: Request, body: ScrapeImagesRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required and cannot be empty.")
    try:
        user_id = get_optional_user_id(request)
        logger.debug(
            f"[Scraper Route] /scrape-images request: url={body.url!r}, user_id={user_id}, "
            f"bypass_cache={body.bypass_cache}, limit={body.limit}, project_id={body.project_id}, "
        )
        result = await scrape_and_initialize_project(
            url=body.url,
            source=body.source,
            cookies=parse_cookie_string(body.cookies) if getattr(body, "cookies", None) else None,
            headers=body.headers,
            bypass_cache=False if body.force_refresh else (body.bypass_cache or False),
            smart_slice=body.smart_slice if body.smart_slice is not None else True,
            scrape_only=getattr(body, "scrape_only", False),
            project_id=body.project_id,
            user_id=user_id,
            title=getattr(body, "title", None),
            episode=getattr(body, "episode", None),
            genre=getattr(body, "genre", None),
            author=getattr(body, "author", None),
            cover_image=getattr(body, "cover_image", None),
            synopsis=getattr(body, "synopsis", None),
            limit=body.limit,
            proxy_images=body.proxy_images if body.proxy_images is not None else True,
            filter_banners=body.filter_banners if body.filter_banners is not None else True,
            include_metadata=body.include_metadata if body.include_metadata is not None else True
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/series/episodes", summary="Scrape series episodes & metadata (Canonical)")
@router.post("/series", summary="Scrape series episodes (Canonical alias)")
async def scrape_episodes(body: ScrapeEpisodesRequest, current_user: dict = Depends(get_current_user)):
    try:
        if not body.url and not body.title_no:
            raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required")
        
        logger.info(f"[Routes] Creating DISCOVER_EPISODES job: url={body.url}, title_no={body.title_no}, ")
        
        job = job_manager.create_job(
        job_type=JobType.DISCOVER_EPISODES,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"url": body.url, "title_no": body.title_no}
    )
        
        async def _episodes_coro(report_progress):
            report_progress(20.0, JobStage.FETCHING.value)
            if body.auto_paginate:
                result = await scrape_webtoon_episodes_paginated(
                    title_no=body.title_no or "",
                    max_episodes=body.max_episodes
                )
            elif body.sort_by != "latest" or body.page != 1:
                result = await scrape_webtoon_episodes_advanced(
                    series_url=body.url or f"?title_no={body.title_no}",
                    title_no=body.title_no,
                    max_episodes=body.max_episodes,
                    page=body.page or 1,
                    include_ratings=body.include_ratings if body.include_ratings is not None else True,
                    sort_by=body.sort_by or "latest",
                    bypass_cache=body.bypass_cache or False
                )
            else:
                result = await scrape_webtoon_episodes(
                    series_url=body.url or f"?title_no={body.title_no}",
                    title_no=body.title_no,
                    max_episodes=body.max_episodes
                )
                
            if not result.get("success"):
                raise Exception(result.get("error", "Failed to scrape episodes"))
            
            report_progress(100.0, JobStage.COMPLETED.value)
            return result

        job_manager.run_in_background(job.job_id, _episodes_coro)
        return job.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Episode Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-episodes-advanced", summary="Scrape episodes with ratings, sorting, and pagination (Legacy alias)")
async def scrape_episodes_advanced(request: Request, body: ScrapeEpisodesAdvancedRequest):
    try:
        if not body.url and not body.title_no:
            raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required")
        
        logger.info(f"[Routes] Advanced episode scrape: title_no={body.title_no}, sort_by={body.sort_by}, ")
        result = await scrape_webtoon_episodes_advanced(
            series_url=body.url or f"?title_no={body.title_no}",
            title_no=body.title_no,
            max_episodes=body.max_episodes,
            page=body.page or 1,
            include_ratings=body.include_ratings if body.include_ratings is not None else True,
            sort_by=body.sort_by or "latest",
            bypass_cache=body.bypass_cache or False
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to scrape episodes"))
        if body.project_id:
            result["project_id"] = body.project_id
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Advanced Episode Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-episodes-paginated", summary="Scrape all episodes with automatic pagination handling (Legacy alias)")
async def scrape_episodes_paginated(request: Request, body: ScrapeEpisodesRequest):
    try:
        if not body.title_no:
            raise HTTPException(status_code=400, detail="'title_no' is required for paginated scraping")
        
        logger.info(f"[Routes] Paginated episode scrape: title_no={body.title_no}, ")
        result = await scrape_webtoon_episodes_paginated(
            title_no=body.title_no,
            max_episodes=body.max_episodes
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to scrape episodes"))
        if body.project_id:
            result["project_id"] = body.project_id
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Paginated Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/series/batch", summary="Batch scrape multiple WEBTOON series (Canonical)")
async def batch_scrape_series_route(body: BatchScrapeSeriesRequest, current_user: dict = Depends(get_current_user)):
    try:
        if not body.series or len(body.series) == 0:
            raise HTTPException(status_code=400, detail="'series' list cannot be empty")
        
        logger.info(f"[Routes] Creating BATCH_SERIES job for {len(body.series)} series, ")
        job = job_manager.create_job(
        job_type=JobType.BATCH_SERIES,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"total_series": len(body.series)}
    )
        
        async def _batch_series_coro(report_progress):
            report_progress(20.0, JobStage.FETCHING.value)
            result = await batch_scrape_series(
                series_list=body.series,
                max_episodes_per_series=body.max_episodes_per_series or 50
            )
            report_progress(100.0, JobStage.COMPLETED.value)
            return {"results": result}

        job_manager.run_in_background(job.job_id, _batch_series_coro)
        return job.model_dump()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Batch Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


from app.core.config import GEMINI_MODEL_PRIMARY

@router.post("/storyboard/video", summary="Scrape chapter & compile draft video pipeline (Canonical)")
async def generate_storyboard(request: Request, body: GenerateStoryboardRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        user_id = get_optional_user_id(request)
        result = await generate_storyboard_and_video(
            url=body.url,
            model=body.model or GEMINI_MODEL_PRIMARY,
            narration_style=body.narrationStyle or "long",
            bypass_cache=body.bypass_cache if body.bypass_cache is not None else True,
            panels=body.panels,
            episode_id=body.episode_id,
            user_id=user_id,
            user_keys=user_keys,
            title=getattr(body, "title", None),
            episode=getattr(body, "episode", None),
            genre=getattr(body, "genre", None),
            author=getattr(body, "author", None),
            cover_image=getattr(body, "cover_image", None),
            synopsis=getattr(body, "synopsis", None)
        )
        return result
    except Exception as e:
        logger.error(f"[Generate Route Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/storyboard/script", summary="Generate storyboard script only (Canonical)")
async def generate_storyboard_only(request: Request, body: GenerateStoryboardOnlyRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        user_id = get_optional_user_id(request)
        result = await generate_storyboard_only_service(
            url=body.url,
            project_id=body.project_id,
            model=body.model or GEMINI_MODEL_PRIMARY,
            narration_style=body.narrationStyle or "long",
            user_id=user_id,
            user_keys=user_keys,
            title=getattr(body, "title", None),
            episode=getattr(body, "episode", None),
            genre=getattr(body, "genre", None),
            author=getattr(body, "author", None),
            cover_image=getattr(body, "cover_image", None),
            synopsis=getattr(body, "synopsis", None)
        )
        return result
    except Exception as e:
        logger.error(f"[Generate Storyboard Route Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-url", summary="Legacy endpoint")
async def process_url(body: ProcessUrlRequest):
    return {"status": "success", "payload": {"url": body.url, "title": "Processed",  "project_id": body.project_id}}


@router.put("/cache/session", summary="Update scraped images session cache (Canonical)")
@router.put("/save-scraped-images", summary="Legacy alias for update scraped images session cache")
async def save_scraped_images(body: SaveScrapedImagesRequest):
    try:
        save_scrape_session(extract_webtoon_url(body.url), body.images)
        return {"success": True,  "project_id": body.project_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools/ocr", summary="Extract AI speech bubble dialogue script via OCR (Canonical)")
async def extract_script(body: ExtractScriptRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")
    try:
        res = await scrape_and_initialize_project(url=body.url, limit=body.limit, proxy_images=False, project_id=body.project_id)
        panel_urls = res.get("images", [])
        
        import httpx
        buffers = []
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            for u in panel_urls[:body.limit or 50]:
                try:
                    resp = await client.get(u)
                    if resp.status_code == 200:
                        buffers.append(resp.content)
                except Exception:
                    pass

        script = await extract_script_from_panels(buffers)
        return {
            "success": True,
            "url": body.url,

            "project_id": body.project_id,
            "total_dialogue_panels": sum(1 for p in script if p["has_dialogue"]),
            "script": script
        }
    except Exception as e:
        logger.error(f"[Extract Script Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tools/export", summary="Export scraped comic panels as .CBZ or .ZIP archive (Canonical)")
async def export_archive(body: ExportArchiveRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")
    try:
        res = await scrape_and_initialize_project(url=body.url, limit=body.limit, proxy_images=False, project_id=body.project_id)
        panel_urls = res.get("images", [])
        metadata = res.get("metadata", {})

        import httpx
        images_data = []
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            for u in panel_urls:
                try:
                    resp = await client.get(u)
                    if resp.status_code == 200:
                        images_data.append({
                            "data": resp.content,
                            "content_type": resp.headers.get("content-type", "image/png")
                        })
                except Exception:
                    pass

        arch_format = (body.format or "cbz").lower()
        archive_bytes = create_comic_archive(images_data, metadata, archive_format=arch_format)
        
        filename = f"{metadata.get('title', 'comic').replace(' ', '_')}.{arch_format}"
        media_type = "application/x-cbz" if arch_format == "cbz" else "application/zip"

        return Response(
            content=archive_bytes,
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    except Exception as e:
        logger.error(f"[Export Archive Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch", summary="Submit background batch scraping job for multiple URLs (Canonical)")
async def batch_scrape(body: BatchScrapeRequest, current_user: dict = Depends(get_current_user)):
    if not body.urls:
        raise HTTPException(status_code=400, detail="URL list cannot be empty.")
    try:
        job = job_manager.create_job(
        job_type=JobType.BATCH_SCRAPE,
        user_id=current_user["user_id"],
        project_id=body.project_id,
        metadata={"urls": body.urls, "total": len(body.urls)}
    )
        
        async def _batch_coro(report_progress):
            total = len(body.urls)
            chapters = []
            for i, u in enumerate(body.urls):
                pct = 10.0 + (float(i) / float(total)) * 80.0
                report_progress(pct, f"Scraping chapter {i+1}/{total}")
                res = await AdaptiveScraperEngine.scrape_url(
                    url=u,
                    limit=body.limit,
                    proxy_images=body.proxy_images,
                    filter_banners=body.filter_banners,
                    project_id=body.project_id,
                    job_id=job.job_id
                )
                chapters.append(res.model_dump())
            report_progress(100.0, JobStage.COMPLETED.value)
            return {"total_urls": total, "chapters": chapters}

        job_manager.run_in_background(job.job_id, _batch_coro)
        
        # Also maintain compatibility with legacy batch job queue

        return {
            "success": True,
            "job_id": job.job_id,
            "type": "BATCH_SCRAPE",
            "status": "QUEUED",
            "project_id": getattr(body, "project_id", None),
            "total_urls": len(body.urls),
            "status_url": f"/api/v1/jobs/{job.job_id}"
        }
    except Exception as e:
        logger.error(f"[Batch Scrape Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))




@router.post("/tools/split", summary="Smart AI panel cutter for vertical Webtoon strips (Canonical)")
async def smart_split(body: SmartSplitRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target image/Webtoon URL is required.")
    try:
        import httpx
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.get(body.url)
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch image URL for splitting.")
            img_bytes = resp.content

        split_buffers = split_vertical_strip_into_panels(
            img_bytes,
            min_panel_height=body.min_panel_height or 250
        )
        
        return {
            "success": True,
            "original_url": body.url,

            "project_id": body.project_id,
            "extracted_panels_count": len(split_buffers),
            "message": f"Successfully split vertical strip into {len(split_buffers)} discrete panels."
        }
    except Exception as e:
        logger.error(f"[Smart Split Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
