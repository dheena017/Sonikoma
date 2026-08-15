"""
backend/app/services/scraper/models.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas and dataclasses for the Adaptive Webtoon/Chapter Scraper.
Defines the authoritative ChapterResult contract, image models, diagnostics,
completeness checks, and structured error models.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime


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
