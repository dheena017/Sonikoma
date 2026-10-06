"""
backend/tests/test_03_landing.py
─────────────────────────────────────────────────────────────────────────────
Tests for Public Platform Landing & Marketing APIs.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_landing_overview(client):
    """GET /api/v1/landing/overview - returns platform statistics and feature cards."""
    response = client.get("/api/v1/landing/overview")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data.get("success") is True or "stats" in data or "features" in data


def test_landing_pricing(client):
    """GET /api/v1/landing/pricing - returns credit tiers and subscription pricing plans."""
    response = client.get("/api/v1/landing/pricing")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))
    if isinstance(data, dict):
        assert data.get("success") is True or "plans" in data or "tiers" in data
    else:
        assert len(data) > 0


def test_landing_showcase(client):
    """GET /api/v1/landing/showcase - returns showcase video demos and creator reels."""
    response = client.get("/api/v1/landing/showcase")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))
