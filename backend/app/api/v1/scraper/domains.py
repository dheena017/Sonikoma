"""
backend/app/api/v1/scraper/domains.py
─────────────────────────────────────────────────────────────────────────────
In-memory domain blocking system & session/cache management.
POST   /block-domain           – Block a domain from scraping
DELETE /block-domain/{domain}  – Unblock a domain
GET    /blocked-domains        – List all blocked domains
POST   /check-blocked          – Pre-check if a URL is blocked
GET    /session                – Get active session panels for a URL
PUT    /session                – Update active session panels
DELETE /session                – Clear active session cache
POST   /cache/clear            – Flush all in-memory scraper caches
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Query

from api.dependencies.auth import get_current_user
from schemas.scraper import (
    BlockDomainRequest,
    BlockDomainResponse,
    BlockedDomainsListResponse,
    CheckBlockedResponse,
    SaveScrapedImagesRequest,
    SeparateUrlRequest,
)
from services.scraper.domain_rate_limiter import domain_block_manager
from services.scraper.scraper_cache_manager import ScraperCacheManager
from services.scraper.url_utils import UrlNormalizer
from repositories.scraper import save_scrape_session, get_scrape_session, delete_scrape_session

logger = logging.getLogger("sonikoma.api.scraper.domains")
router = APIRouter()


# ─── Domain Blocking ──────────────────────────────────────────────────────────

@router.post(
    "/block-domain",
    response_model=BlockDomainResponse,
    summary="Block a domain or URL pattern from scraping"
)
async def block_domain_endpoint(
    body: BlockDomainRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"[Domains API] Blocking domain '{body.domain}' (reason: {body.reason or 'None'})")
    blocked_domain = domain_block_manager.block_domain(body.domain, reason=body.reason or "Blocked by user")
    logger.info(f"[Domains API] Domain '{body.domain}' successfully added to blocklist")
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
    logger.info(f"[Domains API] Unblocking domain '{domain}'")
    success = domain_block_manager.unblock_domain(domain)
    logger.info(f"[Domains API] Domain '{domain}' unblocked (success={success})")
    return {"success": success, "domain": domain, "message": f"Domain '{domain}' removed from blocklist."}


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


# ─── Session & Cache Management ───────────────────────────────────────────────

@router.get("/session", summary="Get active session panel list for a URL")
async def get_session_endpoint(
    url: str = Query(..., description="Source URL of active session"),
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(url)
    session_data = get_scrape_session(extracted_url)
    return {"url": url, "session": session_data}


@router.put("/session", summary="Update active session panel list")
async def update_session_cache_endpoint(
    body: SaveScrapedImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(body.url)
    save_scrape_session(extracted_url, body.images)
    logger.info(f"[Domains API] Saved scrape session with {len(body.images)} panels for '{extracted_url}'")
    return {"success": True, "project_id": body.project_id}


@router.delete("/session", summary="Clear active session cache for a URL")
async def delete_session_endpoint(
    url: str = Query(..., description="Source URL of session to clear"),
    current_user: dict = Depends(get_current_user)
):
    extracted_url = UrlNormalizer.extract_first_url(url)
    delete_scrape_session(extracted_url)
    logger.info(f"[Domains API] Cleared scrape session for '{extracted_url}'")
    return {"success": True, "message": "Session cleared."}


@router.post("/cache/clear", summary="Flush in-memory RAM caches")
async def clear_cache_endpoint(
    current_user: dict = Depends(get_current_user)
):
    ScraperCacheManager.clear()
    logger.info("[Domains API] In-memory scraper cache flushed")
    return {"success": True, "message": "In-memory scraper cache flushed."}
