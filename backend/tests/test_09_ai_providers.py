"""
backend/tests/test_09_ai_providers.py
─────────────────────────────────────────────────────────────────────────────
Tests for AI Foundation Model Catalog, Providers, Status & Gateway.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_providers_health(client, user_headers):
    """GET /api/v1/providers/health - returns AI gateway health."""
    response = client.get("/api/v1/providers/health", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert data.get("status") in ("ok", "healthy") or data.get("success") is True


def test_providers_catalog(client, user_headers):
    """GET /api/v1/providers/catalog - returns complete AI model catalog."""
    response = client.get("/api/v1/providers/catalog", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))


def test_providers_models(client, user_headers):
    """GET /api/v1/providers/models - returns available models across providers."""
    response = client.get("/api/v1/providers/models", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))


def test_providers_routing(client, user_headers):
    """GET /api/v1/providers/routing - returns task routing configurations."""
    response = client.get("/api/v1/providers/routing", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)


def test_providers_edge_tts_voices(client, user_headers):
    """GET /api/v1/providers/edge-tts/voices - returns available Edge TTS neural voices."""
    response = client.get("/api/v1/providers/edge-tts/voices", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


@pytest.mark.parametrize("provider", [
    "gemini",
    "openai",
    "anthropic",
    "deepseek",
    "groq",
    "huggingface",
    "pollinations",
    "edge-tts",
    "elevenlabs",
    "whisper",
])
def test_provider_status_endpoints(client, user_headers, provider):
    """GET /api/v1/providers/{provider}/status - returns status probe for each provider."""
    response = client.get(f"/api/v1/providers/{provider}/status", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
