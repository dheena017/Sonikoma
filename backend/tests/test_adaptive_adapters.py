"""
backend/tests/test_adaptive_adapters.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Unit Tests for All Site & CMS Family Adapters.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.adapters.registry import AdapterRegistry
from services.scraper.adapters.webtoons import WebtoonsAdapter
from services.scraper.adapters.webcomics import WebComicsAdapter
from services.scraper.adapters.mangadex import MangaDexAdapter
from services.scraper.adapters.madara import MadaraCmsAdapter
from services.scraper.adapters.mangastream import MangaStreamAdapter
from services.scraper.adapters.bato import BatoAdapter
from services.scraper.adapters.generic import GenericAdaptiveAdapter
from services.scraper.models import SourceInfo
from services.scraper.context import ScrapeContext, ScrapeConfiguration
from services.scraper.extraction.dom import DomExtractor


def test_registry_matches_webtoons():
    src = SourceInfo(
        original_url="https://www.webtoons.com/en/fantasy/tower/viewer?title_no=95&episode_no=1",
        canonical_url="https://www.webtoons.com/en/fantasy/tower/viewer?title_no=95&episode_no=1",
        domain="www.webtoons.com",
        platform="webtoons"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, WebtoonsAdapter)


def test_registry_matches_webcomics():
    src = SourceInfo(
        original_url="https://www.webcomicsapp.com/en/romance/100-days-until-forever/1/6a57526662661d5cba6bf1e5",
        canonical_url="https://www.webcomicsapp.com/en/romance/100-days-until-forever/1/6a57526662661d5cba6bf1e5",
        domain="www.webcomicsapp.com",
        platform="webcomics"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, WebComicsAdapter)


def test_registry_matches_mangadex():
    src = SourceInfo(
        original_url="https://mangadex.org/chapter/f4325a74-4b53-4819-86ab-d218d6e336d3",
        canonical_url="https://mangadex.org/chapter/f4325a74-4b53-4819-86ab-d218d6e336d3",
        domain="mangadex.org",
        platform="mangadex"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, MangaDexAdapter)


def test_registry_matches_madara_cms():
    src = SourceInfo(
        original_url="https://mangaclash.com/manga/solo-leveling/chapter-100/",
        canonical_url="https://mangaclash.com/manga/solo-leveling/chapter-100/",
        domain="mangaclash.com",
        platform="madara"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, MadaraCmsAdapter)


def test_registry_matches_mangastream():
    src = SourceInfo(
        original_url="https://asuracomic.net/series/return-of-the-mount-hua-sect-chapter-110",
        canonical_url="https://asuracomic.net/series/return-of-the-mount-hua-sect-chapter-110",
        domain="asuracomic.net",
        platform="asura"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, MangaStreamAdapter)


def test_registry_matches_bato():
    src = SourceInfo(
        original_url="https://mangatoto.com/chapter/123456",
        canonical_url="https://mangatoto.com/chapter/123456",
        domain="mangatoto.com",
        platform="bato"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, BatoAdapter)


def test_registry_falls_back_to_generic():
    src = SourceInfo(
        original_url="https://novel-unknown-comic-reader.xyz/read/123",
        canonical_url="https://novel-unknown-comic-reader.xyz/read/123",
        domain="novel-unknown-comic-reader.xyz",
        platform="generic"
    )
    adapter = AdapterRegistry.get_adapter(src)
    assert isinstance(adapter, GenericAdaptiveAdapter)


def test_webcomics_url_metadata_parsing():
    url = "https://www.webcomicsapp.com/en/romance/100-days-until-forever/1/6a57526662661d5cba6bf1e5"
    ctx = ScrapeContext(url=url, config=ScrapeConfiguration())
    adapter = WebComicsAdapter()
    adapter._parse_url_metadata(url, ctx)
    assert ctx.series_info.slug == "100-days-until-forever"
    assert ctx.series_info.genres == ["Romance"]
    assert ctx.series_info.publisher == "WebComics"
    assert ctx.series_info.url == "https://www.webcomicsapp.com/en/comic/100-days-until-forever/6a57526662661d5cba6bf1e5"
    assert ctx.chapter_info.number == 1.0
    assert ctx.chapter_info.episode == "Ch. 1"
    assert ctx.chapter_info.next == "https://www.webcomicsapp.com/en/romance/100-days-until-forever/2/6a57526662661d5cba6bf1e5"


def test_madara_image_extraction():
    html = """
    <div class="reading-content">
        <img data-src="https://img.mangaclash.com/p1.webp" />
        <img data-lazy-src="https://img.mangaclash.com/p2.webp" />
        <img src="https://img.mangaclash.com/p3.webp" />
    </div>
    """
    soup = DomExtractor.get_soup(html)
    adapter = MadaraCmsAdapter()
    images = adapter._extract_madara_images(soup, "https://mangaclash.com/manga/test/ch1")
    assert len(images) == 3
    assert images[0].url == "https://img.mangaclash.com/p1.webp"
    assert images[1].url == "https://img.mangaclash.com/p2.webp"
    assert images[2].url == "https://img.mangaclash.com/p3.webp"


def test_mangastream_image_extraction():
    html = """
    <div id="readerarea">
        <p><img src="https://asuratoon.com/01.jpg" /></p>
        <p><img src="https://asuratoon.com/02.jpg" /></p>
        <p><img data-src="https://asuratoon.com/03.jpg" /></p>
    </div>
    """
    soup = DomExtractor.get_soup(html)
    adapter = MangaStreamAdapter()
    images = adapter._extract_reader_images(soup, "https://asuracomic.net/series/test/ch1")
    assert len(images) == 3
    assert images[0].url == "https://asuratoon.com/01.jpg"
    assert images[1].url == "https://asuratoon.com/02.jpg"
    assert images[2].url == "https://asuratoon.com/03.jpg"


def test_bato_script_image_extraction():
    html = """
    <script>
        const imgHttpLis = [
            "https://cdn.bato.to/1.png",
            "https://cdn.bato.to/2.png",
            "https://cdn.bato.to/3.png"
        ];
    </script>
    """
    adapter = BatoAdapter()
    images = adapter._extract_script_images(html, "https://bato.to/chapter/123")
    assert len(images) == 3
    assert images[0].url == "https://cdn.bato.to/1.png"
    assert images[1].url == "https://cdn.bato.to/2.png"
    assert images[2].url == "https://cdn.bato.to/3.png"


@pytest.mark.anyio
async def test_unknown_website_response_and_domain_request():
    from unittest.mock import patch, AsyncMock
    from services.scraper.engine import AdaptiveScraperEngine
    from services.scraper.ai.domain_memory import DomainMemory

    unknown_url = "https://completely-unknown-custom-manga-reader.org/chapter/1"
    DomainMemory.delete_domain("completely-unknown-custom-manga-reader.org")

    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_http, \
         patch("services.scraper.acquisition.browser.BrowserFetcher.render_page", new_callable=AsyncMock) as mock_browser:
        # Simulate an unknown site that cannot be parsed by static HTTP or browser
        mock_http.return_value = ("<html><body><div>No images here</div></body></html>", 200, 10.0)
        mock_browser.return_value = ("<html><body><div>No images here</div></body></html>", [], {})

        res = await AdaptiveScraperEngine.scrape_url(unknown_url)
        assert res.success is False
        assert res.error is not None
        assert res.error.details is not None
        assert res.error.details.get("is_unmapped_website") is True
        assert res.error.details.get("can_request_domain") is True
        assert res.error.details.get("domain") == "completely-unknown-custom-manga-reader.org"
        assert res.error.details.get("request_url") == "/api/v1/scraper/admin/domains/request"

        # Verify it was auto-registered in DomainMemory as pending
        rec = DomainMemory.get_domain_record("completely-unknown-custom-manga-reader.org")
        assert rec is not None
        assert rec["status"] == "pending"
