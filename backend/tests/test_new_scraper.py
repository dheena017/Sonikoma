import pytest
from bs4 import BeautifulSoup
from backend.app.services.scraper.engine.scoring import ReaderScorer
from backend.app.services.scraper.models.core import ImageAsset
from backend.app.services.scraper.utils.validation import ImageValidator
from backend.app.services.scraper.utils.cache import CacheManager
from backend.app.services.scraper.engine.pipeline import Pipeline
from backend.app.services.scraper.adapters.webtoon import WebtoonAdapter

def test_reader_scorer_detects_reader_container():
    html = """
    <html>
        <body>
            <div class="sidebar">
                <img src="ad1.jpg">
                <a href="#">Link</a>
            </div>
            <div class="viewer" id="reader-container">
                <img src="page1.jpg">
                <img src="page2.jpg">
                <img src="page3.jpg">
                <img src="page4.jpg">
                <img src="page5.jpg">
            </div>
        </body>
    </html>
    """
    soup = BeautifulSoup(html, "html.parser")
    scorer = ReaderScorer()

    best_candidate = scorer.find_best_candidate(soup)

    assert best_candidate.score > 0
    assert best_candidate.element_id == "reader-container"
    assert "viewer" in best_candidate.classes

def test_image_validator_filters_noise():
    validator = ImageValidator()

    img1 = ImageAsset(index=0, url="https://example.com/logo.png", source="dom")
    img2 = ImageAsset(index=1, url="https://example.com/page1.webp", source="dom", width=800, height=1200)
    img3 = ImageAsset(index=2, url="https://example.com/tiny.jpg", source="dom", width=50, height=50)

    assert not validator.validate(img1, is_in_reader=True)  # Name matches negative pattern
    assert validator.validate(img2, is_in_reader=True)      # Good dimensions and name
    assert not validator.validate(img3, is_in_reader=True)  # Too small

def test_cache_manager_detects_new_images():
    cache_mgr = CacheManager()

    cached_images = [
        ImageAsset(index=0, url="img1.jpg", source="dom"),
        ImageAsset(index=1, url="img2.jpg", source="dom")
    ]

    current_images = [
        ImageAsset(index=0, url="img1.jpg", source="dom"),
        ImageAsset(index=1, url="img2.jpg", source="dom"),
        ImageAsset(index=2, url="img3.jpg", source="dom")
    ]

    result = cache_mgr.detect_new_images(current_images, cached_images)

    assert not result[0].is_new
    assert not result[1].is_new
    assert result[2].is_new

def test_pipeline_initialization():
    pipeline = Pipeline()
    assert pipeline.head is not None
    assert type(pipeline.head).__name__ == "Level1StaticHTTPHandler"
    assert pipeline.head._next_handler is not None

def test_webtoon_adapter_can_handle():
    adapter = WebtoonAdapter()
    assert adapter.can_handle("https://www.webtoons.com/en/fantasy/omniscient-reader/list?title_no=2154")
    assert not adapter.can_handle("https://tapas.io/series/example")

from unittest.mock import patch, MagicMock
from backend.app.services.scraper.models.core import ExtractionAttempt, ExtractionStatus, ScrapeDiagnostics, SourceInfo

@patch('backend.app.services.scraper.engine.pipeline.Pipeline.execute')
def test_webtoon_adapter_scrape_failure_propagation(mock_execute):
    mock_execute.return_value = ExtractionAttempt(
        status=ExtractionStatus.FAILED,
        confidence=0,
        diagnostics={"level": "1_static_http", "message": "Failed"}
    )

    adapter = WebtoonAdapter()
    url = "https://www.webtoons.com/en/test/episode/viewer?title_no=123"

    result = adapter.scrape(url)

    assert result.source.domain == "webtoons.com"
    assert len(result.images) == 0
    assert result.scrape.confidence == 0
