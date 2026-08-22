"""
backend/app/services/scraper/models.py
─────────────────────────────────────────────────────────────────────────────
Canonical Schema Bridge for Sonikoma Scraper Service.
Re-exports all Pydantic data models from app.schemas.scraper to ensure a single
source of truth across the entire codebase with zero circular dependencies.
─────────────────────────────────────────────────────────────────────────────
"""

from schemas.scraper import (
    # Core Scrape Result & Manifest Models
    ChapterResult,
    SourceInfo,
    SeriesInfo,
    ChapterInfo,
    ImageItem,
    ScrapeDiagnostics,
    ScrapeErrorCode,
    ScrapeCompleteness,
    CompletenessChecklist,
    ScrapeError,
    EscalationStatus,
    EscalationLevelRecord,
    ImageSourceType,

    
    # Discovery & Candidate Models
    CandidateImage,
    ReaderCandidate,
    EvidenceItem,
    EvidenceSource,
    
    # Request & Configuration DTOs
    ScrapeChapterRequest,
    ScrapeSeriesRequest,
    ScrapeBatchRequest,
    ScrapeAllImagesRequest,
    ScrapeAllImagesResponse,
    RawImageItem,
    SeparateUrlRequest,
    SeparateUrlResponse,
    ValidateImagesRequest,
    ValidateImagesResponse,
    SortImagesRequest,
    SortImagesResponse,
    BlockDomainRequest,
    BlockDomainResponse,
    BlockedDomainsListResponse,
    CheckBlockedResponse,
    AdapterMetaResponse,
    AdaptersListResponse,
    ScraperHealthResponse,
    SessionUpdatePayload,
    SessionStateResponse,
    
    # Configuration Object
    ScrapeConfiguration,
    
    # Aliases
    ScrapedImage,
    ScrapedChapter,
    ScrapedSeries,
    ChapterScrapeResult,
    SeriesScrapeResult,
    UrlSeparationResult,
)

__all__ = [
    "ChapterResult",
    "SourceInfo",
    "SeriesInfo",
    "ChapterInfo",
    "ImageItem",
    "ScrapeDiagnostics",
    "ScrapeErrorCode",
    "ScrapeCompleteness",
    "CompletenessChecklist",
    "EscalationStatus",
    "EscalationLevelRecord",
    "ImageSourceType",
    "CandidateImage",
    "ReaderCandidate",
    "EvidenceItem",
    "EvidenceSource",
    "ScrapeChapterRequest",
    "ScrapeSeriesRequest",
    "ScrapeBatchRequest",
    "ScrapeAllImagesRequest",
    "ScrapeAllImagesResponse",
    "RawImageItem",
    "SeparateUrlRequest",
    "SeparateUrlResponse",
    "ValidateImagesRequest",
    "ValidateImagesResponse",
    "SortImagesRequest",
    "SortImagesResponse",
    "BlockDomainRequest",
    "BlockDomainResponse",
    "BlockedDomainsListResponse",
    "CheckBlockedResponse",
    "AdapterMetaResponse",
    "AdaptersListResponse",
    "ScraperHealthResponse",
    "SessionUpdatePayload",
    "SessionStateResponse",
    "ScrapeConfiguration",
    "ScrapedImage",
    "ScrapedChapter",
    "ScrapedSeries",
    "ChapterScrapeResult",
    "SeriesScrapeResult",
    "UrlSeparationResult",
]
