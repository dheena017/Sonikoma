"""
backend/tests/test_adaptive_evidence.py
─────────────────────────────────────────────────────────────────────────────
Tests for Evidence Collection and Cross-Source Correlation.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.evidence import (
    EvidenceCollector,
    EvidenceCorrelator,
    EvidenceSource
)


def test_evidence_collector_records_and_summarizes():
    collector = EvidenceCollector()
    collector.record(
        source_type=EvidenceSource.DOM_READER,
        source_url="https://example.com/ch1",
        reader_context="#_imageList",
        confidence=0.95,
        discovered_images_count=12
    )
    items = collector.get_all()
    assert len(items) == 1
    assert items[0].source_type == EvidenceSource.DOM_READER
    assert items[0].discovered_images_count == 12
    assert collector.get_total_discovered_count() == 12


def test_evidence_correlator_distinguishes_reader_from_ads():
    dom_urls = {"https://cdn.example.com/ch10/001.jpg", "https://cdn.example.com/ch10/002.jpg"}
    api_urls = set()

    # Exact match gets 1.0
    score_exact = EvidenceCorrelator.correlate_network_image(
        "https://cdn.example.com/ch10/001.jpg",
        dom_urls,
        api_urls,
        chapter_id="10"
    )
    assert score_exact == 1.0

    # Ad gets penalized
    score_ad = EvidenceCorrelator.correlate_network_image(
        "https://adnetwork.example.com/banner_ad_728x90.jpg",
        dom_urls,
        api_urls,
        chapter_id="10"
    )
    assert score_ad < 0.3

    # Correlated CDN asset with chapter ID
    score_cdn = EvidenceCorrelator.correlate_network_image(
        "https://cdn.example.com/comics/ch10/page_003.webp",
        dom_urls,
        api_urls,
        chapter_id="10"
    )
    assert score_cdn >= 0.8
