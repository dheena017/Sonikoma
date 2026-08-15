"""
backend/tests/test_adaptive_validator.py
─────────────────────────────────────────────────────────────────────────────
Tests for Image Validator (Reader-containment first, dimension checks, duplicates).
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from services.scraper.validator import ImageValidator
from services.scraper.models import CandidateImage, ImageSourceType


def test_validator_accepts_valid_reader_images():
    candidates = [
        CandidateImage(url="https://example.com/ch1/001.jpg", is_inside_reader=True, width=800, height=1200),
        CandidateImage(url="https://example.com/ch1/002.jpg", is_inside_reader=True, width=800, height=1200),
    ]
    accepted, rejections = ImageValidator.validate_candidates(candidates)
    assert len(accepted) == 2
    assert len(rejections) == 0


def test_validator_rejects_outside_reader_images():
    candidates = [
        CandidateImage(url="https://example.com/ch1/001.jpg", is_inside_reader=True),
        CandidateImage(url="https://example.com/ads/banner.jpg", is_inside_reader=False),
        CandidateImage(url="https://example.com/authors/avatar.jpg", is_inside_reader=False),
    ]
    accepted, rejections = ImageValidator.validate_candidates(candidates)
    assert len(accepted) == 1
    assert accepted[0].url == "https://example.com/ch1/001.jpg"
    assert len(rejections) == 2
    assert any(r["reason"] == "outside_reader" for r in rejections)


def test_validator_rejects_tiny_icons():
    candidates = [
        CandidateImage(url="https://example.com/pixel.png", is_inside_reader=True, width=1, height=1),
        CandidateImage(url="https://example.com/icon.png", is_inside_reader=True, width=16, height=16),
        CandidateImage(url="https://example.com/panel.jpg", is_inside_reader=True, width=800, height=1200),
    ]
    accepted, rejections = ImageValidator.validate_candidates(candidates)
    assert len(accepted) == 1
    assert accepted[0].url == "https://example.com/panel.jpg"


def test_validator_eliminates_duplicates():
    candidates = [
        CandidateImage(url="https://example.com/p1.jpg", is_inside_reader=True),
        CandidateImage(url="https://example.com/p1.jpg?v=1", is_inside_reader=True),
        CandidateImage(url="https://example.com/p2.jpg", is_inside_reader=True),
    ]
    accepted, rejections = ImageValidator.validate_candidates(candidates)
    assert len(accepted) == 2
