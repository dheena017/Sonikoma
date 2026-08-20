"""
backend/app/services/scraper/adapters/base.py
─────────────────────────────────────────────────────────────────────────────
Abstract base class for Site Adapters.
─────────────────────────────────────────────────────────────────────────────
"""

from abc import ABC, abstractmethod
from typing import Optional
from ..context import ScrapeContext
from ..models import ChapterResult, SourceInfo


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
