"""
backend/tests/test_06_admin.py
─────────────────────────────────────────────────────────────────────────────
Tests for Superuser Admin Governance, Telemetry, Users & Analytics.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_admin_unauthorized_rejection(client):
    """GET /api/v1/admin/users - rejects unauthenticated access with 401."""
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401


def test_admin_non_admin_forbidden(client, non_admin_headers):
    """GET /api/v1/admin/users - non-admin token rejected with 403 Forbidden."""
    response = client.get("/api/v1/admin/users", headers=non_admin_headers)
    assert response.status_code == 403


def test_admin_users_list(client, admin_headers):
    """GET /api/v1/admin/users - returns user accounts when admin."""
    response = client.get("/api/v1/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_admin_analytics(client, admin_headers):
    """GET /api/v1/admin/analytics - returns platform telemetry and analytics."""
    response = client.get("/api/v1/admin/analytics", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data.get("success") is True or "analytics" in data


def test_admin_token_usage(client, admin_headers):
    """GET /api/v1/admin/usage/tokens - returns token usage logs."""
    response = client.get("/api/v1/admin/usage/tokens", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))

