"""
backend/tests/test_08_scraper_proxy.py
─────────────────────────────────────────────────────────────────────────────
Tests for Webtoon Scraper Engines, Adapter Discovery & Image Proxy.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_scraper_health(client):
    """GET /api/v1/scraper/health - returns scraping subsystem status."""
    response = client.get("/api/v1/scraper/health")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data.get("status") in ("ok", "healthy") or data.get("success") is True


def test_scraper_adapters(client, user_headers):
    """GET /api/v1/scraper/adapters - returns list of supported webtoon platform adapters."""
    response = client.get("/api/v1/scraper/adapters", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_scraper_blocked_domains(client, user_headers):
    """GET /api/v1/scraper/blocked-domains - returns list of blocked domains."""
    response = client.get("/api/v1/scraper/blocked-domains", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_scraper_detect_platform(client, user_headers):
    """POST /api/v1/scraper/detect-platform - detects target domain adapter."""
    response = client.post(
        "/api/v1/scraper/detect-platform",
        json={"url": "https://www.webtoons.com/en/fantasy/tower-of-god/episode-1/viewer?title_no=95&episode_no=1"},
        headers=user_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_proxy_stats(client):
    """GET /api/v1/proxy/stats - returns image proxy caching telemetry."""
    response = client.get("/api/v1/proxy/stats")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_proxy_cache_clear(client, admin_headers):
    """DELETE /api/v1/proxy/cache - purges cached proxy assets."""
    response = client.delete("/api/v1/proxy/cache", headers=admin_headers)
    assert response.status_code in (200, 204)
