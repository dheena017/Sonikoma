"""
backend/app/api/v1/scraper/url_tools.py
─────────────────────────────────────────────────────────────────────────────
URL intelligence, decomposition, and platform detection endpoints.
POST /separate-url        – Decompose any comic URL into constituent parts
GET  /separate-url        – Same via query parameter
POST /normalize-url       – Strip tracking params & clean URL
POST /parent-series-url   – Resolve parent series URL from a chapter link
POST /detect-platform     – Detect comic platform and matching adapter
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Depends, Query

from api.dependencies.auth import get_current_user
from schemas.scraper import SeparateUrlRequest, SeparateUrlResponse
from services.scraper.url_utils import UrlNormalizer, UniversalUrlSeparator, SiteAnalyzer
from services.scraper.adapters.site_adapter_registry import AdapterRegistry

logger = logging.getLogger("sonikoma.api.scraper.url_tools")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

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
    return {
        "url": payload.url,
        "domain": source_info.domain,
        "platform": source_info.platform,
        "adapter_name": adapter.__class__.__name__,
        "is_chapter": source_info.is_chapter_url,
        "chapter_number": sep_data.get("chapter_number")
    }
