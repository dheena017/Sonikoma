"""
backend/tests/test_12_ai_series.py
─────────────────────────────────────────────────────────────────────────────
Tests for AI Generated Series Master Router & Projects.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_ai_series_list(client):
    """GET /api/v1/ai-series/ - returns list of AI Generated Series."""
    response = client.get("/api/v1/ai-series/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_ai_series_not_found(client):
    """GET /api/v1/ai-series/{series_id} - returns 404 for non-existent series."""
    response = client.get("/api/v1/ai-series/nonexistent-series-id-999")
    assert response.status_code == 404
