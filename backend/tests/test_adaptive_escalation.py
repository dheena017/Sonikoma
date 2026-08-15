"""
backend/tests/test_adaptive_escalation.py
─────────────────────────────────────────────────────────────────────────────
Tests for evaluated dynamic escalation and early termination.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import pytest
from unittest.mock import patch, AsyncMock
from services.scraper.engine import AdaptiveScraperEngine
from services.scraper.models import ScrapeCompleteness


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "scraper")


def _read_fixture(name: str) -> str:
    with open(os.path.join(FIXTURES_DIR, name), "r", encoding="utf-8") as f:
        return f.read()


@pytest.mark.asyncio
async def test_escalation_early_terminates_on_static_html():
    html = _read_fixture("html_reader.html")

    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_http, \
         patch("services.scraper.acquisition.browser.BrowserFetcher.render_page", new_callable=AsyncMock) as mock_browser:

        mock_http.return_value = (html, 200, 15.0)

        result = await AdaptiveScraperEngine.scrape_url("https://example.com/comic/viewer")

        # Static HTTP & DOM reader succeeded with high confidence
        assert result.success is True
        assert len(result.images) == 4
        assert result.scrape.completeness == ScrapeCompleteness.COMPLETE
        # Playwright browser should NOT have been called!
        mock_browser.assert_not_called()


@pytest.mark.asyncio
async def test_escalation_early_terminates_on_nextjs_payload():
    html = _read_fixture("nextjs_reader.html")

    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_http, \
         patch("services.scraper.acquisition.browser.BrowserFetcher.render_page", new_callable=AsyncMock) as mock_browser:

        mock_http.return_value = (html, 200, 15.0)

        result = await AdaptiveScraperEngine.scrape_url("https://example.com/nextjs/chapter101")

        assert result.success is True
        assert len(result.images) == 3
        # Playwright browser should NOT have been called!
        mock_browser.assert_not_called()
