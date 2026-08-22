"""
backend/app/schemas/scraper.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas and dataclasses for Web Scraping, Ingestion, and Episode Pipelines.
Centralized repository for all scraper domain contracts, enums, DTOs,
and request/response schemas.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import time
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from dataclasses import dataclass


# =============================================================================
# 1. Scraper Core Enums
# =============================================================================

class ScrapeErrorCode(str, Enum):
    """Specific error codes representing scraper failures."""
    READER_NOT_FOUND = "READER_NOT_FOUND"
    CHAPTER_NOT_FOUND = "CHAPTER_NOT_FOUND"
    AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED"
    CONTENT_NOT_ACCESSIBLE = "CONTENT_NOT_ACCESSIBLE"
    NETWORK_ERROR = "NETWORK_ERROR"
    RATE_LIMITED = "RATE_LIMITED"
    INVALID_URL = "INVALID_URL"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class ScrapeCompleteness(str, Enum):
    """Evaluation of extraction completeness."""
    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    UNKNOWN = "UNKNOWN"
    FAILED = "FAILED"


class EscalationStatus(str, Enum):
    """Status returned by each evaluated escalation level."""
    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class ImageSourceType(str, Enum):
    """Origin mechanism for discovered images."""
    DOM = "dom"
    API = "api"
    NETWORK = "network"
    CANVAS = "canvas"
    TILE = "tile"
    BLOB = "blob"
    EMBEDDED_STATE = "embedded_state"
    LOCAL_ARCHIVE = "local_archive"
    METADATA = "metadata"
    NETWORK_INTERCEPTED = "network_intercepted"


class EvidenceSource(str, Enum):
    """Origin sources that can provide chapter, image, or reader evidence."""
    STATIC_HTML = "STATIC_HTML"
    DOM_READER = "DOM_READER"
    EMBEDDED_JSON = "EMBEDDED_JSON"
    EMBEDDED_STATE = "EMBEDDED_STATE"
    NEXT_DATA = "NEXT_DATA"
    NUXT_STATE = "NUXT_STATE"
    REACT_STATE = "REACT_STATE"
    REST_API = "REST_API"
    GRAPHQL = "GRAPHQL"
    XHR = "XHR"
    FETCH = "FETCH"
    NETWORK_INTERCEPTION = "NETWORK_INTERCEPTION"
    BROWSER_RENDER = "BROWSER_RENDER"
    IFRAME = "IFRAME"
    CANVAS = "CANVAS"
    BLOB = "BLOB"
    TILES = "TILES"
    LOCAL_STORAGE = "LOCAL_STORAGE"
    SESSION_STORAGE = "SESSION_STORAGE"
    LOCAL_ARCHIVE = "LOCAL_ARCHIVE"
    FALLBACK_METADATA = "FALLBACK_METADATA"


# =============================================================================
# 2. Scraper Core Domain Models & Contracts
# =============================================================================

class CompletenessChecklist(BaseModel):
    """Checklist indicators that establish scrape completeness."""
    reader_found: bool = False
    chapter_found: bool = False
    reader_end_reached: bool = False
    lazy_loading_finished: bool = False
    api_pages_complete: bool = False
    network_set_complete: bool = False


class SourceInfo(BaseModel):
    """Source website identification and canonical metadata."""
    original_url: str
    canonical_url: str
    domain: str
    platform: Optional[str] = None
    is_chapter_url: bool = True
    requires_auth: bool = False


class SeriesInfo(BaseModel):
    """Series-level metadata extracted from the page."""
    title: Optional[str] = None
    slug: Optional[str] = None
    url: Optional[str] = None
    author: Optional[str] = None
    artist: Optional[str] = None
    publisher: Optional[str] = None
    status: Optional[str] = None
    genres: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    description: Optional[str] = None
    cover: Optional[str] = None
    cover_image: Optional[str] = None
    language: Optional[str] = None


class ChapterInfo(BaseModel):
    """Chapter-level metadata extracted from the page."""
    number: Optional[float] = None
    episode: Optional[str] = None
    title: Optional[str] = None
    url: Optional[str] = None
    published_at: Optional[str] = None
    previous: Optional[str] = None
    next: Optional[str] = None


class ImageItem(BaseModel):
    """Individual chapter image item with validation and ordering info."""
    index: int
    url: str
    proxy_url: Optional[str] = None
    source: str = "dom"
    width: Optional[int] = None
    height: Optional[int] = None
    file_type: Optional[str] = None
    is_new: bool = False
    fingerprint: Optional[str] = None


class ScrapeDiagnostics(BaseModel):
    """Diagnostic metrics and metadata about the scraping run."""
    method: str = "adaptive"
    confidence: float = 0.0
    completeness: ScrapeCompleteness = ScrapeCompleteness.UNKNOWN
    image_count: int = 0
    new_image_count: int = 0
    scraper_version: str = "2.0.0"
    execution_time_ms: float = 0.0
    levels_executed: List[str] = Field(default_factory=list)
    selected_reader: Optional[str] = None
    reader_confidence: float = 0.0
    checklist: CompletenessChecklist = Field(default_factory=CompletenessChecklist)
    rejected_count: int = 0
    rejections: List[Dict[str, str]] = Field(default_factory=list)
    diagnostics_log: List[str] = Field(default_factory=list)


class ScrapeError(BaseModel):
    """Structured error details when scraping cannot be fulfilled."""
    code: ScrapeErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None


class ChapterResult(BaseModel):
    """
    Authoritative common output contract for all scraping flows.
    Everything in Sonikoma eventually resolves to this typed schema.
    """
    success: bool = True
    project_id: Optional[str] = None
    job_id: Optional[str] = None
    total_images: int = 0
    source: SourceInfo
    series: SeriesInfo = Field(default_factory=SeriesInfo)
    chapter: ChapterInfo = Field(default_factory=ChapterInfo)
    images: List[ImageItem] = Field(default_factory=list)
    scrape: ScrapeDiagnostics = Field(default_factory=ScrapeDiagnostics)
    error: Optional[ScrapeError] = None


class CandidateImage(BaseModel):
    """Internal candidate representation during discovery and validation."""
    url: str
    source_type: ImageSourceType = ImageSourceType.DOM
    dom_index: int = 0
    index: Optional[int] = None
    container_selector: Optional[str] = None
    is_inside_reader: bool = True
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[float] = None
    mime_type: Optional[str] = None
    raw_attributes: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0


class ReaderCandidate(BaseModel):
    """Candidate DOM reader container with computed score."""
    selector: str
    element_tag: str
    image_count: int = 0
    score: float = 0.0
    text_length: int = 0
    has_large_images: bool = False
    is_vertical_layout: bool = True
    is_selected: bool = False


class EvidenceItem(BaseModel):
    """An individual piece of discovery evidence recorded during scraping."""
    source_type: EvidenceSource
    source_url: str
    chapter_id: Optional[str] = None
    reader_context: Optional[str] = None
    payload_summary: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    confidence: float = 1.0
    discovered_images_count: int = 0
    timestamp: float = Field(default_factory=time.time)


@dataclass
class EscalationLevelRecord:
    """Record of an executed escalation level."""
    level_name: str
    status: EscalationStatus
    confidence: float
    images_found: int
    duration_ms: float
    reason: Optional[str] = None


@dataclass
class ScrapeConfiguration:
    """Runtime options for the scrape execution."""
    bypass_cache: bool = False
    force_refresh: bool = False
    proxy_images: bool = True
    filter_banners: bool = True
    limit: Optional[int] = None
    timeout_seconds: float = 30.0
    enable_browser_fallback: bool = True
    smart_slice: bool = True
    cookies: Optional[Dict[str, str]] = None
    headers: Optional[Dict[str, str]] = None
    save_debug_html: bool = False
    project_id: Optional[str] = None
    job_id: Optional[str] = None


# =============================================================================
# 3. Scraping & Episode Ingestion API Schemas
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


class SeparateUrlRequest(BaseModel):
    """Request to decompose and analyze any comic URL into constituent parts."""
    url: str


class SeparateUrlResponse(BaseModel):
    """Structured breakdown of an entered comic/manga URL."""
    success: bool = True
    raw_url: str
    canonical_url: str
    series_url: str
    chapter_url: Optional[str] = None
    is_chapter_url: bool
    is_series_url: bool
    platform: str
    domain: str
    title_slug: Optional[str] = None
    title_id: Optional[str] = None
    series_slug: Optional[str] = None
    series_id: Optional[str] = None
    chapter_slug: Optional[str] = None
    chapter_number: Optional[str] = None
    title_no: Optional[str] = None
    target_adapter: Optional[str] = None
    recommended_action: str
    supported_actions: List[str]


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
    per_page: Optional[int] = 100
    language: Optional[str] = "en"
    sort_by: Optional[str] = "latest"
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
    sort_by: Optional[str] = "latest"
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
# 4. Script & Storyboard Generation Schemas
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
# 5. Export Schemas
# =============================================================================

class ExportArchiveRequest(BaseModel):
    """Exports scraped comic episodes as CBZ archives."""
    url: str
    project_id: Optional[str] = None
    format: Optional[str] = "cbz"
    limit: Optional[int] = None


# =============================================================================
# 6. Scraper Intelligence & Domain Schemas
# =============================================================================

class ScraperAIAnalyzeRequest(BaseModel):
    """Request to inspect or analyze comic URL structure or raw HTML."""
    url: str
    html: Optional[str] = None
    bypass_cache: Optional[bool] = False
    cookies: Optional[str] = None
    headers: Optional[Dict[str, str]] = None


class ScraperAIAnalyzeResponse(BaseModel):
    """Response containing extracted blueprint and structure telemetry."""
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
    status: str = "approved"
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
    status: Optional[str] = None
    blueprint: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    sample_url: Optional[str] = None


class DomainRequestSubmission(BaseModel):
    """User submission to request onboarding of a comic website."""
    url: str
    notes: Optional[str] = None
