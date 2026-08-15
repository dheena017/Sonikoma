"""
backend/tests/test_adaptive_context.py
─────────────────────────────────────────────────────────────────────────────
Tests for ScrapeContext and Completeness evaluation.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.context import ScrapeContext, ScrapeConfiguration
from services.scraper.models import (
    ScrapeCompleteness,
    ImageItem,
    EscalationStatus,
    ScrapeErrorCode,
    ScrapeError
)


def test_scrape_context_initialization_and_logging():
    ctx = ScrapeContext(url="https://example.com/ch1")
    ctx.log("Starting scrape")
    assert len(ctx.diagnostics_logs) == 1
    assert ctx.completeness == ScrapeCompleteness.UNKNOWN


def test_scrape_context_record_level():
    ctx = ScrapeContext(url="https://example.com/ch1")
    ctx.record_level(
        level_name="Level 1: Static HTTP",
        status=EscalationStatus.SUCCESS,
        confidence=90.0,
        images_found=10,
        duration_ms=120.5
    )
    assert len(ctx.level_history) == 1
    assert ctx.level_history[0].status == EscalationStatus.SUCCESS
    assert ctx.level_history[0].confidence == 90.0


def test_scrape_context_to_chapter_result():
    ctx = ScrapeContext(url="https://example.com/ch1")
    ctx.validated_images = [
        ImageItem(index=0, url="https://example.com/p1.jpg", is_new=True),
        ImageItem(index=1, url="https://example.com/p2.jpg", is_new=False)
    ]
    ctx.completeness = ScrapeCompleteness.COMPLETE
    result = ctx.to_chapter_result()

    assert result.success is True
    assert len(result.images) == 2
    assert result.scrape.new_image_count == 1
    assert result.scrape.completeness == ScrapeCompleteness.COMPLETE
