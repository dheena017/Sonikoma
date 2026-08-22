"""
backend/app/services/scraper/__init__.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma Universal Adaptive Webtoon / Chapter Scraper Package.
─────────────────────────────────────────────────────────────────────────────
"""

from .scraper_engine import AdaptiveScraperEngine, adaptive_scraper_engine
from .scraper_models import (
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
    ScrapeConfiguration,
    CandidateImage,
    ImageSourceType,
    EscalationStatus
)
from .scrape_context import ScrapeContext
from .url_utils import UrlNormalizer, SiteAnalyzer, UniversalUrlSeparator
from .scraper_service import (
    scrape_images_from_url,
    scrape_and_initialize_project,
    generate_storyboard_and_video,
    generate_storyboard_only_service
)
from .scraper_workflow import (
    scrape_series_episodes,
    scrape_series_episodes_advanced,
    scrape_series_episodes_paginated,
    batch_scrape_series,
    batch_scrape_chapters_with_checkpoint
)
from .adapters import (
    BaseSiteAdapter,
    GenericAdaptiveAdapter,
    WebtoonsAdapter,
    WebComicsAdapter,
    MangaDexAdapter,
    MadaraCmsAdapter,
    MangaStreamAdapter,
    BatoAdapter,
    InkrAdapter,
    AdapterRegistry
)
from .content_validator import ImageValidator
from .image_order_resolver import OrderResolver
from .content_evaluator import AccessEvaluator, ExtractionEvaluator
from .scraper_cache_manager import ScraperCacheManager
from .domain_rate_limiter import DomainRateLimiter, DomainBlockManager, rate_limiter, domain_block_manager


__all__ = [
    "AdaptiveScraperEngine",
    "adaptive_scraper_engine",
    "ChapterResult",
    "SourceInfo",
    "SeriesInfo",
    "ChapterInfo",
    "ImageItem",
    "CandidateImage",
    "ImageSourceType",
    "EscalationStatus",
    "ScrapeDiagnostics",
    "ScrapeErrorCode",
    "ScrapeCompleteness",
    "CompletenessChecklist",
    "ScrapeContext",
    "ScrapeConfiguration",
    "UrlNormalizer",
    "SiteAnalyzer",
    "UniversalUrlSeparator",
    "scrape_images_from_url",
    "scrape_and_initialize_project",
    "generate_storyboard_and_video",
    "generate_storyboard_only_service",
    "scrape_series_episodes",
    "scrape_series_episodes_advanced",
    "scrape_series_episodes_paginated",
    "batch_scrape_series",
    "batch_scrape_chapters_with_checkpoint",
    "BaseSiteAdapter",
    "GenericAdaptiveAdapter",
    "WebtoonsAdapter",
    "WebComicsAdapter",
    "MangaDexAdapter",
    "MadaraCmsAdapter",
    "MangaStreamAdapter",
    "BatoAdapter",
    "InkrAdapter",
    "AdapterRegistry",
    "ImageValidator",
    "OrderResolver",
    "AccessEvaluator",
    "ExtractionEvaluator",
    "ScraperCacheManager",
    "DomainRateLimiter",
    "DomainBlockManager",
    "rate_limiter",
    "domain_block_manager"
]
