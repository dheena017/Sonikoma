"""
backend/app/api/v1/scraper.py
─────────────────────────────────────────────────────────────────────────────
FastAPI route controllers for Webtoon scraping. Exposes HTTP interfaces,
parses authorization tokens, and delegates logic to scraper services.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import asyncio
import jwt
from typing import Dict, Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import Response

from api.dependencies.auth import get_all_user_keys
from schemas.scraper import (
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


from services.scraper.scraper import (
    scrape_webtoon_episodes,
    extract_webtoon_url
)
from services.workflows.scraper import (
    scrape_webtoon_episodes_advanced,
    scrape_webtoon_episodes_paginated,
    batch_scrape_series
)
from repositories.scraper import save_scrape_session
from services.scraper.scraper_service import (
    scrape_and_initialize_project,
    generate_storyboard_and_video,
    generate_storyboard_only_service
)
from services.scraper.ocr_service import extract_script_from_panels
from services.scraper.archive_exporter import create_comic_archive
from services.scraper.batch_job_service import create_batch_job, get_batch_job_status, execute_batch_job
from services.scraper.panel_splitter import split_vertical_strip_into_panels

ALGORITHM = "HS256"
logger = logging.getLogger("sonikoma.api.scraper")

scraper_router = APIRouter()
router = scraper_router


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


@router.post("/scrape-images", summary="Scrape comic panels from Webtoon URL")
async def scrape_images(request: Request, body: ScrapeImagesRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required and cannot be empty.")
    try:
        user_id = get_optional_user_id(request)
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


@router.post("/scrape-episodes", summary="Scrape WEBTOON episode list and metadata")
async def scrape_episodes(request: Request, body: ScrapeEpisodesRequest):
    try:
        if not body.url and not body.title_no:
            raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required")
        
        logger.info(f"[Routes] Episode scrape request: url={body.url}, title_no={body.title_no}")
        result = await scrape_webtoon_episodes(
            series_url=body.url or f"?title_no={body.title_no}",
            title_no=body.title_no,
            max_episodes=body.max_episodes
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to scrape episodes"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Episode Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-episodes-advanced", summary="Scrape episodes with ratings, sorting, and pagination")
async def scrape_episodes_advanced(request: Request, body: ScrapeEpisodesAdvancedRequest):
    try:
        if not body.url and not body.title_no:
            raise HTTPException(status_code=400, detail="Either 'url' or 'title_no' is required")
        
        logger.info(f"[Routes] Advanced episode scrape: title_no={body.title_no}, sort_by={body.sort_by}")
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
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Advanced Episode Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scrape-episodes-paginated", summary="Scrape all episodes with automatic pagination handling")
async def scrape_episodes_paginated(request: Request, body: ScrapeEpisodesRequest):
    try:
        if not body.title_no:
            raise HTTPException(status_code=400, detail="'title_no' is required for paginated scraping")
        
        logger.info(f"[Routes] Paginated episode scrape: title_no={body.title_no}")
        result = await scrape_webtoon_episodes_paginated(
            title_no=body.title_no,
            max_episodes=body.max_episodes
        )
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Failed to scrape episodes"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Paginated Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/batch-scrape-series", summary="Batch scrape multiple WEBTOON series")
async def batch_scrape_series_route(request: Request, body: BatchScrapeSeriesRequest):
    try:
        if not body.series or len(body.series) == 0:
            raise HTTPException(status_code=400, detail="'series' list cannot be empty")
        
        logger.info(f"[Routes] Batch scrape request for {len(body.series)} series")
        result = await batch_scrape_series(
            series_list=body.series,
            max_episodes_per_series=body.max_episodes_per_series or 50
        )
        return {"success": True, "results": result}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Batch Scraper Route Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", summary="Generate storyboard and narrative scripts")
async def generate_storyboard(request: Request, body: GenerateStoryboardRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        user_id = get_optional_user_id(request)
        result = await generate_storyboard_and_video(
            url=body.url,
            model=body.model or "gemini-2.5-flash",
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


@router.post("/generate-storyboard", summary="Generate storyboard only")
async def generate_storyboard_only(request: Request, body: GenerateStoryboardOnlyRequest, user_keys: dict = Depends(get_all_user_keys)):
    try:
        user_id = get_optional_user_id(request)
        result = await generate_storyboard_only_service(
            url=body.url,
            project_id=body.project_id,
            model=body.model or "gemini-2.5-flash",
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
    return {"status": "success", "payload": {"url": body.url, "title": "Processed"}}


@router.put("/save-scraped-images", summary="Update scraped images cache")
async def save_scraped_images(body: SaveScrapedImagesRequest):
    try:
        save_scrape_session(extract_webtoon_url(body.url), body.images)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract-script", summary="Extract AI speech bubble dialogue script via OCR")
async def extract_script(body: ExtractScriptRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")
    try:
        res = await scrape_and_initialize_project(url=body.url, limit=body.limit, proxy_images=False)
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
            "total_dialogue_panels": sum(1 for p in script if p["has_dialogue"]),
            "script": script
        }
    except Exception as e:
        logger.error(f"[Extract Script Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-archive", summary="Export scraped comic panels as .CBZ or .ZIP archive")
async def export_archive(body: ExportArchiveRequest):
    if not body.url or not body.url.strip():
        raise HTTPException(status_code=400, detail="Target Webtoon URL is required.")
    try:
        res = await scrape_and_initialize_project(url=body.url, limit=body.limit, proxy_images=False)
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


@router.post("/batch-scrape", summary="Submit background batch scraping job for multiple URLs")
async def batch_scrape(body: BatchScrapeRequest):
    if not body.urls:
        raise HTTPException(status_code=400, detail="URL list cannot be empty.")
    try:
        job_id = create_batch_job(body.urls)
        options = {
            "limit": body.limit,
            "proxy_images": body.proxy_images,
            "filter_banners": body.filter_banners,
            "include_metadata": body.include_metadata
        }
        asyncio.create_task(execute_batch_job(job_id, options))
        return {
            "success": True,
            "job_id": job_id,
            "status": "queued",
            "total_urls": len(body.urls),
            "status_url": f"/api/v1/scraper/batch-status/{job_id}"
        }
    except Exception as e:
        logger.error(f"[Batch Scrape Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/batch-status/{job_id}", summary="Check background batch scraping status")
async def get_batch_status(job_id: str):
    job = get_batch_job_status(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Batch job '{job_id}' not found.")
    return {"success": True, "job": job}


@router.post("/smart-split", summary="Smart AI panel cutter for vertical Webtoon strips")
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
            "extracted_panels_count": len(split_buffers),
            "message": f"Successfully split vertical strip into {len(split_buffers)} discrete panels."
        }
    except Exception as e:
        logger.error(f"[Smart Split Error] {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
