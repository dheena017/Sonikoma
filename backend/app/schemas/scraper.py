"""
backend/app/schemas/scraper.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for web scraping, ingestion, and script generation.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional


# =============================================================================
# 1. Scraping & Episode Ingestion
# =============================================================================

class ScrapeChapterRequest(BaseModel):
    """Canonical request for scraping a single chapter URL via AdaptiveScraperEngine."""
    url: str
    project_id: Optional[str] = None
    chapter_id: Optional[str] = None
    force_refresh: Optional[bool] = False
    bypass_cache: Optional[bool] = False
    limit: Optional[int] = None
    proxy_images: Optional[bool] = True
    filter_banners: Optional[bool] = True
    cookies: Optional[str] = None
    headers: Optional[Dict[str, str]] = None


class ScrapeImagesRequest(BaseModel):
    """Scrapes episode images from Webtoon URLs."""
    url: str
    source: Optional[str] = None
    cookies: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    force_refresh: Optional[bool] = True
    bypass_cache: Optional[bool] = True
    smart_slice: Optional[bool] = True
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None
    project_id: Optional[str] = None
    scrape_only: Optional[bool] = False
    limit: Optional[int] = None
    proxy_images: Optional[bool] = True
    filter_banners: Optional[bool] = True
    include_metadata: Optional[bool] = True


class ProcessUrlRequest(BaseModel):
    """Validates or parses a Webtoon URL."""
    url: str
    project_id: Optional[str] = None


class SaveScrapedImagesRequest(BaseModel):
    """Persists scraped images to storage."""
    url: str
    images: List[str]
    project_id: Optional[str] = None


class ScrapeEpisodesRequest(BaseModel):
    """Extracts episode lists from a comic series with optional pagination and filtering."""
    url: Optional[str] = None
    title_no: Optional[str] = None
    max_episodes: Optional[int] = None
    page: Optional[int] = 1
    sort_by: Optional[str] = "latest"  # latest, oldest, rating, likes
    include_ratings: Optional[bool] = True
    auto_paginate: Optional[bool] = False
    bypass_cache: Optional[bool] = False
    project_id: Optional[str] = None


class ScrapeEpisodesAdvancedRequest(BaseModel):
    """Paginated, sorted episode scraping."""
    url: Optional[str] = None
    title_no: Optional[str] = None
    max_episodes: Optional[int] = None
    page: Optional[int] = 1
    include_ratings: Optional[bool] = True
    sort_by: Optional[str] = "latest"  # latest, oldest, rating, likes
    bypass_cache: Optional[bool] = False
    project_id: Optional[str] = None


class BatchScrapeSeriesRequest(BaseModel):
    """Scrapes multiple comic series simultaneously."""
    series: List[Dict[str, Optional[str]]]
    max_episodes_per_series: Optional[int] = 50
    project_id: Optional[str] = None


class BatchScrapeRequest(BaseModel):
    """Scrapes multiple episode URLs in batch."""
    urls: List[str]
    project_id: Optional[str] = None
    limit: Optional[int] = None
    proxy_images: Optional[bool] = True
    filter_banners: Optional[bool] = True
    include_metadata: Optional[bool] = True
    cookies: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    bypass_cache: Optional[bool] = False


# =============================================================================
# 2. Script & Storyboard Generation
# =============================================================================

class GenerateStoryboardOnlyRequest(BaseModel):
    """Generates a storyboard script from a URL without video compilation."""
    url: str
    project_id: str
    model: Optional[str] = None
    narrationStyle: Optional[str] = "long"
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None


class GenerateStoryboardRequest(BaseModel):
    """Generates a full storyboard with panels and audio tracks."""
    url: str
    project_id: Optional[str] = None
    episode_id: Optional[str] = None
    panels: Optional[List[Dict[str, Any]]] = None
    custom_background_video: Optional[str] = None
    model: Optional[str] = None
    bypass_cache: Optional[bool] = True
    narrationStyle: Optional[str] = "long"
    title: Optional[str] = None
    episode: Optional[str] = None
    genre: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    synopsis: Optional[str] = None


class ExtractScriptRequest(BaseModel):
    """Extracts script and text data from a Webtoon URL."""
    url: str
    project_id: Optional[str] = None
    limit: Optional[int] = None


class SmartSplitRequest(BaseModel):
    """Automatically splits long vertical strips into individual panel images."""
    url: str
    project_id: Optional[str] = None
    min_panel_height: Optional[int] = 250


# =============================================================================
# 3. Export
# =============================================================================

class ExportArchiveRequest(BaseModel):
    """Exports scraped comic episodes as CBZ archives."""
    url: str
    project_id: Optional[str] = None
    format: Optional[str] = "cbz"
    limit: Optional[int] = None


# =============================================================================
# 4. AI Scraper Intelligence & Blueprint Schemas
# =============================================================================

class ScraperAIAnalyzeRequest(BaseModel):
    """Request to directly test or invoke the AI Scraper Orchestrator on a comic URL or raw HTML."""
    url: str
    html: Optional[str] = None
    bypass_cache: Optional[bool] = False
    cookies: Optional[str] = None
    headers: Optional[Dict[str, str]] = None


class ScraperAIAnalyzeResponse(BaseModel):
    """Direct response containing AI-extracted UniversalComicBlueprint and performance telemetry."""
    success: bool
    job_id: Optional[str] = None
    url: str
    is_cached: bool
    latency_ms: float
    total_images: int = 0
    blueprint: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class DomainRecord(BaseModel):
    """Configuration and approval record for a comic scraping domain."""
    domain: str
    status: str = "approved"  # "approved", "pending", "blocked"
    blueprint: Optional[Dict[str, Any]] = None
    success_count: int = 0
    failure_count: int = 0
    requested_by: Optional[str] = None
    sample_url: Optional[str] = None
    notes: Optional[str] = None
    last_success_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class DomainListResponse(BaseModel):
    """Paginated or filtered list of domain approval records."""
    domains: List[DomainRecord]
    total: int


class DomainUpdateRequest(BaseModel):
    """Admin payload to update domain blueprint, status, or notes."""
    status: Optional[str] = None  # "approved", "pending", "blocked"
    blueprint: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    sample_url: Optional[str] = None


class DomainRequestSubmission(BaseModel):
    """User submission to request onboarding of an unapproved comic website."""
    url: str
    notes: Optional[str] = None
