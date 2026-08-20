"""
backend/app/services/scraper/adapters/__init__.py
─────────────────────────────────────────────────────────────────────────────
Modular site and CMS family adapters for Sonikoma Scraper.
─────────────────────────────────────────────────────────────────────────────
"""
from .base import BaseSiteAdapter
from .generic import GenericAdaptiveAdapter
from .webtoons import WebtoonsAdapter
from .webcomics import WebComicsAdapter
from .mangadex import MangaDexAdapter
from .madara import MadaraCmsAdapter
from .mangastream import MangaStreamAdapter
from .bato import BatoAdapter
from .registry import AdapterRegistry

__all__ = [
    "BaseSiteAdapter",
    "GenericAdaptiveAdapter",
    "WebtoonsAdapter",
    "WebComicsAdapter",
    "MangaDexAdapter",
    "MadaraCmsAdapter",
    "MangaStreamAdapter",
    "BatoAdapter",
    "AdapterRegistry",
]
