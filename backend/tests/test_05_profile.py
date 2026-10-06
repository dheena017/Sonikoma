"""
backend/tests/test_05_profile.py
─────────────────────────────────────────────────────────────────────────────
Tests for Creator Profile, Credits, Billing, Sessions & API Keys.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_profile_me_unauthorized(client):
    """GET /api/v1/profile/me - rejects unauthorized requests with 401."""
    response = client.get("/api/v1/profile/me")
    assert response.status_code == 401


def test_profile_me_authorized(client, user_headers):
    """GET /api/v1/profile/me - returns user profile data when authorized."""
    response = client.get("/api/v1/profile/me", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "user_id" in data or "email" in data or "id" in data


def test_profile_credits(client, user_headers):
    """GET /api/v1/profile/credits - returns compute credit balance."""
    response = client.get("/api/v1/profile/credits", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "credits" in data or "balance" in data or "success" in data


def test_profile_claim_daily_credits(client, user_headers):
    """POST /api/v1/profile/claim-daily-credits - claims daily login credits."""
    response = client.post("/api/v1/profile/claim-daily-credits", headers=user_headers)
    assert response.status_code in (200, 400)


def test_profile_sessions(client, user_headers):
    """GET /api/v1/profile/sessions - returns list of active sessions."""
    response = client.get("/api/v1/profile/sessions", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_profile_api_keys_list(client, user_headers):
    """GET /api/v1/profile/api-keys - returns user developer API keys."""
    response = client.get("/api/v1/profile/api-keys", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_profile_audit_logs(client, user_headers):
    """GET /api/v1/profile/audit-logs - returns user security audit history."""
    response = client.get("/api/v1/profile/audit-logs", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_profile_analytics(client, user_headers):
    """GET /api/v1/profile/analytics - returns creator performance analytics."""
    response = client.get("/api/v1/profile/analytics", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_profile_invoices(client, user_headers):
    """GET /api/v1/profile/invoices - returns user subscription invoices."""
    response = client.get("/api/v1/profile/invoices", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_profile_transactions(client, user_headers):
    """GET /api/v1/profile/transactions - returns user credit transaction history."""
    response = client.get("/api/v1/profile/transactions", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))
