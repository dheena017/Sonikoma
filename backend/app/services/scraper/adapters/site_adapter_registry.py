"""
backend/app/services/scraper/adapters/registry.py
─────────────────────────────────────────────────────────────────────────────
Site Adapter Registry for dynamic platform adapter selection.
Dispatches incoming scrape URLs to specialized platform and CMS adapters.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Type
from .base_site_adapter import BaseSiteAdapter
from .generic_site_adapter import GenericAdaptiveAdapter
from .webtoons_adapter import WebtoonsAdapter
from .webcomics_adapter import WebComicsAdapter
from .mangadex_adapter import MangaDexAdapter
from .madara_adapter import MadaraCmsAdapter
from .mangastream_adapter import MangaStreamAdapter
from .bato_adapter import BatoAdapter
from .inkr_adapter import InkrAdapter
from ..scraper_models import SourceInfo


class AdapterRegistry:
    """Maintains list of available site adapters and matches URLs to adapters."""

    _adapters: List[Type[BaseSiteAdapter]] = [
        # Direct Platform Adapters
        MangaDexAdapter,
        WebtoonsAdapter,
        WebComicsAdapter,
        BatoAdapter,
        InkrAdapter,
        
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
