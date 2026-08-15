"""
backend/tests/test_scraper.py
─────────────────────────────────────────────────────────────────────────────
Unit tests for the new Adaptive Webtoon / Chapter Scraper facade and parser.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.extraction.dom import DomExtractor
from services.scraper.reader_detector import ReaderDetector
from services.scraper.workflow import scrape_webtoon_episodes


def test_dom_extractor_empty_soup():
    soup = DomExtractor.get_soup("")
    assert soup is None


def test_reader_detector_ignores_creator_notes_and_avatars():
    sample_html = """
    <html>
      <body>
        <div class="creator_note">
          <img src="https://example.com/creator_avatar.jpg" />
        </div>
        <div id="_imageList">
          <img src="https://example.com/panel_1.jpg" />
          <img src="https://example.com/panel_2.jpg" />
        </div>
        <div class="author_area">
          <img src="https://example.com/author_profile.jpg" />
        </div>
      </body>
    </html>
    """
    candidates, best = ReaderDetector.detect_reader(sample_html)
    assert best is not None
    assert best.selector == "#_imageList"

    soup = DomExtractor.get_soup(sample_html)
    selected_node = soup.select_one(best.selector)
    extracted = DomExtractor.extract_images_from_container(selected_node, "https://example.com/comic/viewer")

    extracted_urls = [c.url for c in extracted]
    assert "https://example.com/panel_1.jpg" in extracted_urls
    assert "https://example.com/panel_2.jpg" in extracted_urls
    assert "https://example.com/creator_avatar.jpg" not in extracted_urls
    assert "https://example.com/author_profile.jpg" not in extracted_urls
