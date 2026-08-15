"""
backend/app/services/scraper/adapters/__init__.py
"""
from .base import BaseSiteAdapter
from .generic import GenericAdaptiveAdapter
from .webtoons import WebtoonsAdapter
from .registry import AdapterRegistry

__all__ = [
    "BaseSiteAdapter",
    "GenericAdaptiveAdapter",
    "WebtoonsAdapter",
    "AdapterRegistry"
]
