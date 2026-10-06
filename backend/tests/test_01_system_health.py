"""
backend/tests/test_01_system_health.py
─────────────────────────────────────────────────────────────────────────────
Tests for System Health, Status, Telemetry & Logging Endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_system_health_endpoint(client):
    """GET /api/v1/system/health - verifies core system health."""
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert data.get("status") == "ok"
    assert "Sonikoma" in data.get("service", "")
    assert "capabilities" in data
    assert "database" in data


def test_system_status_endpoint(client):
    """GET /api/v1/system/status - verifies host machine and server status."""
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") in ("ok", "online", "healthy") or data.get("success") is True


def test_system_health_ffmpeg(client):
    """GET /api/v1/system/health/ffmpeg - verifies multimedia compiler availability."""
    response = client.get("/api/v1/system/health/ffmpeg")
    assert response.status_code == 200
    data = response.json()
    assert "available" in data or "installed" in data or "status" in data or "ffmpeg" in data


def test_system_logs_unauthorized(client):
    """GET /api/v1/system/logs - public/auth diagnostic endpoint returns logs."""
    response = client.get("/api/v1/system/logs")
    # Endpoint is accessible for UI system terminal panel or requires auth depending on configuration
    assert response.status_code in (200, 401)
    if response.status_code == 200:
        data = response.json()
        assert isinstance(data, (list, dict))


def test_system_logs_authenticated(client, admin_headers):
    """GET /api/v1/system/logs - returns structured log entries when authenticated."""
    response = client.get("/api/v1/system/logs", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))
