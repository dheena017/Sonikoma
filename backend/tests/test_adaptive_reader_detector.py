"""
backend/tests/test_adaptive_reader_detector.py
─────────────────────────────────────────────────────────────────────────────
Tests for Reader Candidate Scoring & Boundary Isolation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import pytest
from services.scraper.reader_detector import ReaderDetector


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures", "scraper")


def _read_fixture(name: str) -> str:
    with open(os.path.join(FIXTURES_DIR, name), "r", encoding="utf-8") as f:
        return f.read()


def test_reader_detector_isolates_html_reader():
    html = _read_fixture("html_reader.html")
    candidates, best = ReaderDetector.detect_reader(html)

    assert best is not None
    assert best.score >= 50.0
    assert best.image_count == 4
    # Ensure it selected the viewer list, not header, sidebar, or author notes
    assert "_imagelist" in best.selector.lower() or "viewer_lst" in best.selector.lower()


def test_reader_detector_rejects_cover_and_ads_page():
    html = _read_fixture("cover_and_ads_reader.html")
    candidates, best = ReaderDetector.detect_reader(html)

    # No valid reader should be selected on a page that only has header/ads/recommendations
    assert best is None


def test_reader_detector_on_empty_or_non_reader_page():
    html = _read_fixture("no_reader.html")
    candidates, best = ReaderDetector.detect_reader(html)
    assert best is None
