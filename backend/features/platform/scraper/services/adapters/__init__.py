"""
backend/app/services/scraper/adapters/__init__.py
─────────────────────────────────────────────────────────────────────────────
Modular site and CMS family adapters for Sonikoma Scraper.
─────────────────────────────────────────────────────────────────────────────
"""
from .base_site_adapter import BaseSiteAdapter
from .generic_site_adapter import GenericAdaptiveAdapter
from .webtoons_adapter import WebtoonsAdapter
from .webcomics_adapter import WebComicsAdapter
from .mangadex_adapter import MangaDexAdapter
from .madara_adapter import MadaraCmsAdapter
from .mangastream_adapter import MangaStreamAdapter
from .bato_adapter import BatoAdapter
from .inkr_adapter import InkrAdapter
from .site_adapter_registry import AdapterRegistry

__all__ = [
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
]
