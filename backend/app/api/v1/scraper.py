"""
backend/app/api/v1/scraper.py
─────────────────────────────────────────────────────────────────────────────
FastAPI route controllers for Webtoon scraping. Exposes HTTP interfaces,
parses authorization tokens, and delegates logic to scraper services.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import jwt
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends

from api.dependencies.auth import get_all_user_keys
from schemas.scraper import (
    ScrapeImagesRequest,
    ScrapeEpisodesRequest,
    ScrapeEpisodesAdvancedRequest,
    BatchScrapeSeriesRequest,
    GenerateStoryboardRequest,
    GenerateStoryboardOnlyRequest,
    ProcessUrlRequest,
    SaveScrapedImagesRequest
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
from repositories.scraper_repository import save_scrape_session
from services.scraper.scraper_service import (
    scrape_and_initialize_project,
    generate_storyboard_and_video,
    generate_storyboard_only_service
)

ALGORITHM = "HS256"
logger = logging.getLogger("sonikoma.api.scraper")

scraper_router = APIRouter()
router = scraper_router


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
    try:
        user_id = get_optional_user_id(request)
        result = await scrape_and_initialize_project(
            url=body.url,
            source=body.source,
            bypass_cache=body.bypass_cache,
            smart_slice=body.smart_slice,
            scrape_only=getattr(body, "scrape_only", False),
            project_id=body.project_id,
            user_id=user_id,
            title=getattr(body, "title", None),
            episode=getattr(body, "episode", None),
            genre=getattr(body, "genre", None),
            author=getattr(body, "author", None),
            cover_image=getattr(body, "cover_image", None),
            synopsis=getattr(body, "synopsis", None)
        )
        return result
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
            include_ratings=body.include_ratings,
            sort_by=body.sort_by or "latest"
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
async def batch_scrape(request: Request, body: BatchScrapeSeriesRequest):
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
            model=body.model,
            narration_style=body.narrationStyle or "long",
            bypass_cache=body.bypass_cache,
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
            model=body.model,
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
