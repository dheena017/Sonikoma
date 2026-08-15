"""
backend/tests/test_adaptive_normalizer.py
─────────────────────────────────────────────────────────────────────────────
Tests for URL Normalizer and Site Analyzer.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.normalizer import UrlNormalizer, SiteAnalyzer


def test_url_normalizer_cleans_tracking_and_whitespace():
    raw = "  https://www.webtoons.com/en/fantasy/tower/ep-1/viewer?title_no=123&episode_no=1&utm_source=facebook&fbclid=xyz123  "
    canonical = UrlNormalizer.normalize_url(raw)
    assert "utm_source" not in canonical
    assert "fbclid" not in canonical
    assert "title_no=123" in canonical
    assert "episode_no=1" in canonical


def test_url_normalizer_extracts_first_url():
    concatenated = "https://example.com/ch-1 https://example.com/ch-2"
    extracted = UrlNormalizer.extract_first_url(concatenated)
    assert extracted == "https://example.com/ch-1"


def test_site_analyzer_identifies_webtoons():
    url = "https://www.webtoons.com/en/fantasy/tower/viewer?title_no=95&episode_no=1"
    info = SiteAnalyzer.analyze(url)
    assert info.domain == "www.webtoons.com"
    assert info.platform == "webtoons"
    assert info.is_chapter_url is True
    assert info.requires_auth is False


def test_site_analyzer_identifies_series_vs_chapter():
    series_url = "https://www.webtoons.com/en/fantasy/tower/list?title_no=95"
    info = SiteAnalyzer.analyze(series_url)
    assert info.is_chapter_url is False

    chapter_url = "https://example.com/manga/solo-leveling/chapter-100"
    ch_info = SiteAnalyzer.analyze(chapter_url)
    assert ch_info.is_chapter_url is True
