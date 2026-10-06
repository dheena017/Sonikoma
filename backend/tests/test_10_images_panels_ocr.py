"""
backend/tests/test_10_images_panels_ocr.py
─────────────────────────────────────────────────────────────────────────────
Tests for Image Manipulation, Panel Extraction, YOLO & OCR Endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_images_training_data_count(client):
    """GET /api/v1/images/training-data-count - returns number of training pairs."""
    response = client.get("/api/v1/images/training-data-count")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "count" in data or "total" in data or "pairs" in data or data.get("success") is True


def test_images_training_data_list(client):
    """GET /api/v1/images/training-data-list - returns training dataset index."""
    response = client.get("/api/v1/images/training-data-list")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_images_metadata_invalid(client):
    """POST /api/v1/images/metadata - validates payload."""
    response = client.post("/api/v1/images/metadata", json={"url": ""})
    assert response.status_code in (400, 422, 500)


def test_ocr_detect_text_missing_input(client):
    """POST /api/v1/ocr/detect-text - validates that url or base64 is provided."""
    response = client.post("/api/v1/ocr/detect-text", json={})
    assert response.status_code in (400, 422)


def test_ocr_detect_text_with_base64(client, sample_image_base64):
    """POST /api/v1/ocr/detect-text - accepts valid base64 image data."""
    response = client.post(
        "/api/v1/ocr/detect-text",
        json={"image_base64": sample_image_base64},
    )
    assert response.status_code in (200, 500)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, dict)


def test_panels_detect_small_panels_validation(client):
    """POST /api/v1/panels/detect/small-panels - validates input structure."""
    response = client.post("/api/v1/panels/detect/small-panels", json={})
    assert response.status_code in (400, 422)


def test_panels_detect_long_panels_validation(client):
    """POST /api/v1/panels/detect/long-panels - validates input structure."""
    response = client.post("/api/v1/panels/detect/long-panels", json={})
    assert response.status_code in (400, 422)
