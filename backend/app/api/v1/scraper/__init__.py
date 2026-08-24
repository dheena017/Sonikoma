"""
backend/app/api/v1/scraper/__init__.py
─────────────────────────────────────────────────────────────────────────────
Scraper API package — assembles all scraper sub-routers into a single
`scraper_router` that api/router.py mounts at /api/v1/scraper.

Sub-modules (in registration order):
  url_tools.py    – Section 1: URL intelligence & decomposition
  chapter.py      – Section 2: Chapter panel extraction
  discovery.py    – Section 3: Raw all-image & technology-specific discovery
  series.py       – Section 4: Series/episode discovery + batch crawler
  validation.py   – Section 5: Image validation & reading-order sort
  domains.py      – Section 6: Domain blocking + session/cache management
  system.py       – Section 7: Adapter registry, health, project ingestion
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from api.v1.scraper.url_tools import router as url_tools_router
from api.v1.scraper.chapter import router as chapter_router
from api.v1.scraper.discovery import router as discovery_router
from api.v1.scraper.series import router as series_router
from api.v1.scraper.validation import router as validation_router
from api.v1.scraper.domains import router as domains_router
from api.v1.scraper.system import router as system_router

scraper_router = APIRouter()

# ── Section 1: URL Intelligence & Decomposition ───────────────────────────────
scraper_router.include_router(url_tools_router)

# ── Section 2: Chapter Panel Extraction ──────────────────────────────────────
scraper_router.include_router(chapter_router)

# ── Section 3: Raw Image Discovery (all strategies) ──────────────────────────
scraper_router.include_router(discovery_router)

# ── Section 4: Series & Episode Discovery + Batch Crawl ──────────────────────
scraper_router.include_router(series_router)

# ── Section 5: Image Validation & Reading-Order Sort ─────────────────────────
scraper_router.include_router(validation_router)

# ── Section 6: Domain Blocking + Session / Cache ─────────────────────────────
scraper_router.include_router(domains_router)

# ── Section 7: Adapter Registry, Health & Project Ingestion ──────────────────
scraper_router.include_router(system_router)

# Backward-compat alias (some internal imports reference `router`)
router = scraper_router

__all__ = ["scraper_router", "router"]
