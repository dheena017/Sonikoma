"""
backend/app/features/platform/scraper/router.py
─────────────────────────────────────────────────────────────────────────────
Scraper feature router managing webtoon chapter discovery, scraping, and proxy.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter
from features.platform.scraper import scraper_router
from features.platform.scraper.proxy import proxy_router

scraper_master_router = APIRouter()
scraper_master_router.include_router(scraper_router, tags=["03. Webtoon Scraping"])
scraper_master_router.include_router(proxy_router, prefix="/proxy", tags=["03. Webtoon Scraping"])

router = scraper_master_router

__all__ = ["router", "scraper_master_router"]
