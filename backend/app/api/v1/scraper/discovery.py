"""
backend/app/api/v1/scraper/discovery.py
─────────────────────────────────────────────────────────────────────────────
Raw image discovery across multiple technology strategies.
POST /all-images                    – Scrape ALL images (unfiltered)
GET  /all-images                    – Same via query parameter
POST /discover/html-dom             – Static HTML DOM <img> scan
POST /discover/javascript-state     – JS AST embedded state extraction
POST /discover/network-traffic      – Playwright live network interception
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from urllib.parse import quote

from fastapi import APIRouter, HTTPException, Depends, Query

from api.dependencies.auth import get_current_user
from schemas.scraper import (
    ScrapeAllImagesRequest,
    ScrapeAllImagesResponse,
    SeparateUrlRequest,
)
from services.scraper.scraper_engine import AdaptiveScraperEngine
from services.scraper.acquisition.http_page_fetcher import HttpFetcher
from services.scraper.acquisition.browser_page_fetcher import BrowserFetcher
from services.scraper.extraction.html_dom_extractor import DomExtractor
from services.scraper.extraction.embedded_state_extractor import EmbeddedStateExtractor

logger = logging.getLogger("sonikoma.api.scraper.discovery")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

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
        logger.warning("[Discovery API] POST /all-images received empty URL")
        raise HTTPException(status_code=400, detail="Target URL cannot be empty.")
    logger.info(f"[Discovery API] Extracting all raw images from '{body.url}' (render_js={body.render_js}, bypass_cache={body.bypass_cache})")
    res = await AdaptiveScraperEngine.extract_all_raw_images(
        url=body.url.strip(),
        render_js=body.render_js,
        bypass_cache=body.bypass_cache,
        include_backgrounds=body.include_backgrounds,
        include_svg=body.include_svg,
        cookies=body.cookies,
        headers=body.headers
    )
    logger.info(f"[Discovery API] Found {len(res.images)} raw image(s) from '{body.url}'")
    return res


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
        logger.warning("[Discovery API] GET /all-images received empty URL")
        raise HTTPException(status_code=400, detail="URL query parameter is required.")
    logger.info(f"[Discovery API] Extracting all raw images (GET) from '{url}'")
    res = await AdaptiveScraperEngine.extract_all_raw_images(
        url=url.strip(),
        render_js=render_js,
        include_backgrounds=include_backgrounds,
        include_svg=include_svg
    )
    logger.info(f"[Discovery API] Found {len(res.images)} raw image(s) from '{url}'")
    return res


@router.post(
    "/discover/html-dom",
    summary="Discover static HTML DOM images only (<img>, data-src, srcset)"
)
async def discover_html_dom_endpoint(
    body: ScrapeAllImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"[Discovery API] Discovering static HTML DOM images from '{body.url}'")
    html, _, _ = await HttpFetcher.fetch_html(body.url)
    if not html:
        logger.error(f"[Discovery API] Failed to fetch HTML for '{body.url}'")
        raise HTTPException(status_code=400, detail="Could not fetch HTML.")
    soup = DomExtractor.get_soup(html)
    candidates = DomExtractor.extract_manga_images_fallback(soup, body.url) if soup else []
    logger.info(f"[Discovery API] Extracted {len(candidates)} static DOM images from '{body.url}'")
    return {
        "url": body.url,
        "technology": "static_html_dom",
        "total_images": len(candidates),
        "images": [
            {
                "index": i,
                "url": c.url,
                "proxy_url": f"/api/proxy-image?url={quote(c.url)}&referer={quote(body.url)}",
                "source": c.source_type.value
            }
            for i, c in enumerate(candidates)
        ]
    }


@router.post(
    "/discover/javascript-state",
    summary="Discover images inside JavaScript AST objects (__NEXT_DATA__, window.__DATA__)"
)
async def discover_js_state_endpoint(
    body: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"[Discovery API] Discovering JS AST embedded state images from '{body.url}'")
    html, _, _ = await HttpFetcher.fetch_html(body.url)
    if not html:
        logger.error(f"[Discovery API] Failed to fetch HTML for '{body.url}'")
        raise HTTPException(status_code=400, detail="Could not fetch HTML.")
    state_candidates = EmbeddedStateExtractor.extract_from_html(html, body.url)
    logger.info(f"[Discovery API] Extracted {len(state_candidates)} embedded state images from '{body.url}'")
    return {
        "url": body.url,
        "technology": "javascript_embedded_state",
        "total_images": len(state_candidates),
        "images": [
            {
                "index": i,
                "url": c.url,
                "proxy_url": f"/api/proxy-image?url={quote(c.url)}&referer={quote(body.url)}",
                "source": c.source_type.value
            }
            for i, c in enumerate(state_candidates)
        ]
    }


@router.post(
    "/discover/network-traffic",
    summary="Discover images via Playwright live network packet interception"
)
async def discover_network_traffic_endpoint(
    body: SeparateUrlRequest,
    current_user: dict = Depends(get_current_user)
):
    html, net_images, _ = await BrowserFetcher.render_page(body.url, auto_scroll=True)
    formatted_images = []
    for i, item in enumerate(net_images or []):
        img_u = item.get("url") if isinstance(item, dict) else str(item)
        formatted_images.append({
            "index": i,
            "url": img_u,
            "proxy_url": f"/api/proxy-image?url={quote(img_u)}&referer={quote(body.url)}" if img_u else ""
        })
    return {
        "url": body.url,
        "technology": "browser_network_interception",
        "total_images": len(formatted_images),
        "images": formatted_images
    }
