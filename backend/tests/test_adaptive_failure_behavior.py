"""
backend/tests/test_adaptive_failure_behavior.py
─────────────────────────────────────────────────────────────────────────────
Tests for strict failure behavior.
Ensures READER_NOT_FOUND is returned and NEVER falls back to series covers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import pytest
from unittest.mock import patch, AsyncMock
from services.scraper.engine import AdaptiveScraperEngine
from services.scraper.models import ScrapeErrorCode, ScrapeCompleteness


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "scraper")


def _read_fixture(name: str) -> str:
    with open(os.path.join(FIXTURES_DIR, name), "r", encoding="utf-8") as f:
        return f.read()


@pytest.mark.asyncio
async def test_failure_on_cover_and_ads_page_never_uses_cover_as_panels():
    html = _read_fixture("cover_and_ads_reader.html")

    # Mock HTTP fetcher returning cover & ads page HTML
    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = (html, 200, 10.0)

        result = await AdaptiveScraperEngine.scrape_url(
            url="https://example.com/series/main",
            enable_browser_fallback=False
        )

        assert result.success is False
        assert result.error is not None
        assert result.error.code == ScrapeErrorCode.READER_NOT_FOUND
        assert len(result.images) == 0
        assert result.scrape.completeness == ScrapeCompleteness.FAILED


@pytest.mark.asyncio
async def test_failure_on_empty_non_reader_page():
    html = _read_fixture("no_reader.html")

    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = (html, 200, 10.0)

        result = await AdaptiveScraperEngine.scrape_url(
            url="https://example.com/about",
            enable_browser_fallback=False
        )

        assert result.success is False
        assert result.error is not None
        assert result.error.code == ScrapeErrorCode.READER_NOT_FOUND
        assert len(result.images) == 0
