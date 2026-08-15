"""
backend/app/services/scraper/__init__.py
─────────────────────────────────────────────────────────────────────────────
Adaptive Webtoon / Chapter Scraper Package.
Exports core engine, models, workflows, and service compatibility facades.
─────────────────────────────────────────────────────────────────────────────
"""

from .engine import AdaptiveScraperEngine
from .models import (
    ChapterResult,
    SourceInfo,
    SeriesInfo,
    ChapterInfo,
    ImageItem,
    ScrapeDiagnostics,
    ScrapeErrorCode,
    ScrapeCompleteness,
    CompletenessChecklist,
    ScrapeError
)
from .context import ScrapeContext, ScrapeConfiguration
from .normalizer import UrlNormalizer, SiteAnalyzer
from .service import (
    scrape_images_from_url,
    scrape_and_initialize_project,
    generate_storyboard_and_video,
    generate_storyboard_only_service
)
from .workflow import (
    scrape_webtoon_episodes,
    scrape_webtoon_episodes_advanced,
    scrape_webtoon_episodes_paginated,
    batch_scrape_series
)
from .ocr import extract_script_from_panels
from .export import create_comic_archive
from .splitter import split_vertical_strip_into_panels

__all__ = [
    "AdaptiveScraperEngine",
    "ChapterResult",
    "SourceInfo",
    "SeriesInfo",
    "ChapterInfo",
    "ImageItem",
    "ScrapeDiagnostics",
    "ScrapeErrorCode",
    "ScrapeCompleteness",
    "CompletenessChecklist",
    "ScrapeError",
    "ScrapeContext",
    "ScrapeConfiguration",
    "UrlNormalizer",
    "SiteAnalyzer",
    "scrape_images_from_url",
    "scrape_and_initialize_project",
    "generate_storyboard_and_video",
    "generate_storyboard_only_service",
    "scrape_webtoon_episodes",
    "scrape_webtoon_episodes_advanced",
    "scrape_webtoon_episodes_paginated",
    "batch_scrape_series",
    "extract_script_from_panels",
    "create_comic_archive",
    "split_vertical_strip_into_panels"
]
