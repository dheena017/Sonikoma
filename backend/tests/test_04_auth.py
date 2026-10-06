"""
backend/tests/test_04_auth.py
─────────────────────────────────────────────────────────────────────────────
Tests for Authentication, Registration, Token Verification, and Guarding.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_auth_verify_token_unauthorized(client):
    """GET /api/v1/auth/token - returns 401 when Authorization header is missing."""
    response = client.get("/api/v1/auth/token")
    assert response.status_code == 401
    assert "Missing Authorization token" in response.json().get("detail", "")


def test_auth_verify_token_invalid(client):
    """GET /api/v1/auth/token - returns 401 when token is invalid."""
    response = client.get(
        "/api/v1/auth/token",
        headers={"Authorization": "Bearer invalid.token.payload"},
    )
    assert response.status_code == 401


def test_auth_verify_token_valid(client, user_headers):
    """GET /api/v1/auth/token - returns 200 with user profile info when valid."""
    response = client.get("/api/v1/auth/token", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("valid") is True
    assert data.get("success") is True
    assert "user" in data


def test_auth_token_post_missing_fields(client):
    """POST /api/v1/auth/token - returns 400 when username or password are missing."""
    response = client.post("/api/v1/auth/token", json={})
    assert response.status_code in (400, 422)


def test_auth_login_invalid_credentials(client):
    """POST /api/v1/auth/login - returns 400 or 401 when credentials do not match."""
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_user@sonikoma.ai", "password": "wrong_password_123"},
    )
    assert response.status_code in (400, 401)


def test_auth_register_validation(client):
    """POST /api/v1/auth/register - returns 422 for unprocessable entity when fields are invalid."""
    response = client.post("/api/v1/auth/register", json={"email": "not-an-email"})
    assert response.status_code == 422


def test_protected_route_rejection(client):
    """Protected endpoints reject requests without Authorization token."""
    response = client.get("/api/v1/profile/me")
    assert response.status_code == 401
