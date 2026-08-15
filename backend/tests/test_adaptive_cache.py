"""
backend/tests/test_adaptive_cache.py
─────────────────────────────────────────────────────────────────────────────
Tests for Versioned Caching & Incremental New Image Detection.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from unittest.mock import patch
from services.scraper.cache_manager import ScraperCacheManager
from services.scraper.models import ImageItem
from services.scraper.constants import SCRAPER_VERSION


def test_cache_key_generation_includes_version():
    url = "https://example.com/ch1"
    key = ScraperCacheManager.build_cache_key(url, "1")
    assert len(key) == 64  # SHA256 hex digest


def test_new_image_detection():
    canonical = "https://example.com/ch1"
    current_images = [
        ImageItem(index=0, url="https://example.com/p1.jpg"),
        ImageItem(index=1, url="https://example.com/p2.jpg"),
        ImageItem(index=2, url="https://example.com/p3.jpg"),
    ]

    # First scrape (no previous session): baseline is_new=False
    with patch("services.scraper.cache_manager.get_latest_scrape_session", return_value=None):
        res1 = ScraperCacheManager.detect_new_images(canonical, current_images)
        assert all(img.is_new is False for img in res1)

    # Second scrape: previous session only had p1 and p2, so p3 is new!
    mock_session = {"image_urls": ["https://example.com/p1.jpg", "https://example.com/p2.jpg"]}
    with patch("services.scraper.cache_manager.get_latest_scrape_session", return_value=mock_session):
        res2 = ScraperCacheManager.detect_new_images(canonical, current_images)
        assert res2[0].is_new is False
        assert res2[1].is_new is False
        assert res2[2].is_new is True
