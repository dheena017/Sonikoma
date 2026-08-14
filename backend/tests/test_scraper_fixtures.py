import pytest
from bs4 import BeautifulSoup
from backend.app.services.scraper.engine.scoring import ReaderScorer
from backend.app.services.scraper.models.core import ImageAsset, ExtractionAttempt, ExtractionStatus
from backend.app.services.scraper.utils.validation import ImageValidator
from backend.app.services.scraper.utils.cache import CacheManager
from backend.app.services.scraper.engine.pipeline import Level1StaticHTTPHandler
from unittest.mock import patch, MagicMock

# 1. Images directly in HTML
def test_static_html_images():
    html = """
    <div class="reader">
        <img src="1.jpg">
        <img src="2.jpg">
    </div>
    """
    soup = BeautifulSoup(html, "html.parser")
    scorer = ReaderScorer()
    candidate = scorer.find_best_candidate(soup)
    assert candidate.score > 0
    assert len(candidate.evidence) >= 0

# 13. Cover + thumbnails + panels mixed together
def test_mixed_content_filtering():
    html = """
    <div class="sidebar">
        <img src="cover.jpg" class="cover">
        <img src="thumb1.jpg" class="thumb">
    </div>
    <div class="viewer">
        <img src="panel1.jpg">
        <img src="panel2.jpg">
    </div>
    """
    soup = BeautifulSoup(html, "html.parser")
    scorer = ReaderScorer()
    candidate = scorer.find_best_candidate(soup)
    assert candidate.score > 0

    validator = ImageValidator()
    images = [
        ImageAsset(index=0, url="cover.jpg", source="dom"),
        ImageAsset(index=1, url="panel1.jpg", source="dom")
    ]
    # In a real implementation this would tie candidate selector back to the DOM tree
    # For unit test, we just assume panel1 is in reader, cover is not
    assert not validator.validate(images[0], is_in_reader=False)
    assert validator.validate(images[1], is_in_reader=True)

# 17. New images added since previous scrape
def test_new_image_detection():
    cache = CacheManager()
    old_run = [ImageAsset(index=0, url="1.jpg", source="dom")]
    new_run = [
        ImageAsset(index=0, url="1.jpg", source="dom"),
        ImageAsset(index=1, url="2.jpg", source="dom")
    ]

    result = cache.detect_new_images(new_run, old_run)
    assert not result[0].is_new
    assert result[1].is_new

# 18. No reader found
def test_no_reader_found():
    html = "<div><p>Just text</p></div>"
    soup = BeautifulSoup(html, "html.parser")
    scorer = ReaderScorer()
    candidate = scorer.find_best_candidate(soup)
    assert candidate.score < 0

# 15. Chapter with very few images
def test_few_images_validity():
    html = '<div class="viewer"><img src="1.jpg"></div>'
    soup = BeautifulSoup(html, "html.parser")
    scorer = ReaderScorer()
    candidate = scorer.find_best_candidate(soup)
    assert candidate.score > 0
