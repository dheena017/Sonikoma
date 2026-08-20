"""
backend/app/services/scraper/adapters/registry.py
─────────────────────────────────────────────────────────────────────────────
Site Adapter Registry for dynamic platform adapter selection.
Dispatches incoming scrape URLs to specialized platform and CMS adapters.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Type
from .base import BaseSiteAdapter
from .generic import GenericAdaptiveAdapter
from .webtoons import WebtoonsAdapter
from .webcomics import WebComicsAdapter
from .mangadex import MangaDexAdapter
from .madara import MadaraCmsAdapter
from .mangastream import MangaStreamAdapter
from .bato import BatoAdapter
from ..models import SourceInfo


class AdapterRegistry:
    """Maintains list of available site adapters and matches URLs to adapters."""

    _adapters: List[Type[BaseSiteAdapter]] = [
        # Direct Platform Adapters
        MangaDexAdapter,
        WebtoonsAdapter,
        WebComicsAdapter,
        BatoAdapter,
        
        # CMS Family Adapters (covering 100+ scanlation sites)
        MadaraCmsAdapter,
        MangaStreamAdapter,
        
        # Universal Heuristic & Playwright Fallback
        GenericAdaptiveAdapter
    ]

    @classmethod
    def get_adapter(cls, source_info: SourceInfo) -> BaseSiteAdapter:
        """Returns an instantiated adapter matching the given source info."""
        for adapter_cls in cls._adapters:
            if adapter_cls.matches(source_info):
                return adapter_cls()
        return GenericAdaptiveAdapter()

    @classmethod
    def register(cls, adapter_cls: Type[BaseSiteAdapter]) -> None:
        """Dynamically registers a new specialized site adapter at high priority."""
        if adapter_cls not in cls._adapters:
            cls._adapters.insert(0, adapter_cls)

    @classmethod
    def get_all_adapters_meta(cls) -> List[dict]:
        """Returns metadata for all registered adapters without any hardcoding."""
        return [adapter_cls.get_meta() for adapter_cls in cls._adapters]
