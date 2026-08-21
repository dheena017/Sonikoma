"""
backend/app/services/scraper/adapters/base.py
─────────────────────────────────────────────────────────────────────────────
Abstract base class for Site Adapters.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from abc import ABC, abstractmethod
from typing import Optional
from ..context import ScrapeContext
from ..models import ChapterResult, SourceInfo

logger = logging.getLogger("sonikoma.services.scraper.adapters.base")


class BaseSiteAdapter(ABC):
    """Base interface for specialized site adapters."""

    name: str = "Base Adapter"
    icon: str = "🌐"
    description: str = ""
    supported_domains: list = []

    @classmethod
    @abstractmethod
    def matches(cls, source_info: SourceInfo) -> bool:
        """Determines if this adapter handles the given source website."""
        pass

    @abstractmethod
    async def scrape(self, context: ScrapeContext) -> ChapterResult:
        """Executes the site-specific extraction workflow and populates context."""
        pass

    def _finalize(self, context: ScrapeContext, start_time: float) -> ChapterResult:
        """
        Shared finalization step: validates candidate images, resolves order,
        logs diagnostics, and builds the final ChapterResult.

        All subclasses (Madara, Generic, Webtoons, etc.) inherit this so
        that finalization logic stays in one place.
        """
        from ..validator import ImageValidator
        from ..order_resolver import OrderResolver
        from ..diagnostics import ScraperDiagnosticsLogger

        total_ms = (time.time() - start_time) * 1000
        validated, rejections = ImageValidator.validate_candidates(
            context.candidate_images,
            filter_banners=context.config.filter_banners
        )
        context.rejections.extend(rejections)
        context.validated_images = OrderResolver.resolve_order(validated)

        ScraperDiagnosticsLogger.log_result(
            chapter_number=context.chapter_info.number,
            images_count=len(context.validated_images),
            new_images_count=0,
            completeness=context.completeness.value,
            execution_time_ms=total_ms,
        )
        return context.to_chapter_result()

    @classmethod
    def get_meta(cls) -> dict:
        """Returns metadata dictionary for this adapter."""
        return {
            "adapter_id": cls.__name__,
            "name": cls.name,
            "icon": cls.icon,
            "description": cls.description,
            "supported_domains": list(cls.supported_domains)
        }
