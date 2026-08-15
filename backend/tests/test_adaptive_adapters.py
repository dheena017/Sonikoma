"""
backend/tests/test_adaptive_adapters.py
─────────────────────────────────────────────────────────────────────────────
Tests for Site Adapters and AdapterRegistry.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.adapters.registry import AdapterRegistry
from services.scraper.adapters.webtoons import WebtoonsAdapter
from services.scraper.adapters.generic import GenericAdaptiveAdapter
from services.scraper.models import SourceInfo


def test_registry_matches_webtoons():
    src = SourceInfo(
        original_url="https://www.webtoons.com/en/fantasy/tower/viewer?title_no=95&episode_no=1",
        canonical_url="https://www.webtoons.com/en/fantasy/tower/viewer?title_no=95&episode_no=1",
        domain="www.webtoons.com",
        platform="webtoons"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, WebtoonsAdapter)


def test_registry_falls_back_to_generic():
    src = SourceInfo(
        original_url="https://somemangasite.com/chapter-5",
        canonical_url="https://somemangasite.com/chapter-5",
        domain="somemangasite.com",
        platform="generic"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, GenericAdaptiveAdapter)
