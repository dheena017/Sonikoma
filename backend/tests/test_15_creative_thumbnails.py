"""
backend/tests/test_15_creative_thumbnails.py
─────────────────────────────────────────────────────────────────────────────
Tests for the AI Thumbnail Generator Studio:
- POST /api/v1/creative/thumbnails/generate (3-pack & 6-pack)
─────────────────────────────────────────────────────────────────────────────
"""

import io
import pytest
from PIL import Image


@pytest.fixture(autouse=True)
def mock_pollinations_diffusion(monkeypatch):
    """Provides hermetic image bytes for external Pollinations API during unit tests."""
    buf = io.BytesIO()
    Image.new("RGBA", (1280, 720), (30, 40, 60, 255)).save(buf, format="PNG")
    valid_bytes = buf.getvalue()

    async def _mock_generate(*args, **kwargs):
        model = kwargs.get("model") or (args[3] if len(args) > 3 else "flux-anime")
        return valid_bytes, str(model), None

    from ai_engine.providers.pollinations import PollinationsClient
    monkeypatch.setattr(PollinationsClient, "generate_image", _mock_generate)


def test_generate_single_thumbnail(client, user_headers):
    """POST /api/v1/creative/thumbnails/generate - generates 1 distinct 16:9 thumbnail by default."""
    payload = {
        "prompt": "Solo Leveling Awakening, electric gold aura, shock reaction",
        "series_title": "Solo Leveling",
        "genre": "Action Fantasy",
    }
    response = client.post("/api/v1/creative/thumbnails/generate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 1
    assert len(data["thumbnails"]) == 1
    thumb = data["thumbnails"][0]
    assert thumb["id"].startswith("thumb_")
    assert thumb["image_url"].startswith("/api/v1/images/cached/")
    assert thumb["width"] == 1280
    assert thumb["height"] == 720
    assert "tier_used" in data
    assert "model_used" in data
    assert "provider_used" in data


def test_generate_thumbnails_3_pack(client, user_headers):
    """POST /api/v1/creative/thumbnails/generate - generates 3 distinct thumbnails."""
    payload = {
        "prompt": "Solo Leveling Awakening, electric gold aura, shock reaction",
        "count": 3,
        "series_title": "Solo Leveling",
        "genre": "Action Fantasy",
        "panels": [],
    }
    response = client.post("/api/v1/creative/thumbnails/generate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 3
    assert len(data["thumbnails"]) == 3

    for item in data["thumbnails"]:
        assert item["id"].startswith("thumb_")
        assert item["image_url"].startswith("/api/v1/images/cached/")
        assert "archetype" in item
        assert "hook_text" in item
        assert item["width"] == 1280
        assert item["height"] == 720


def test_generate_thumbnails_6_pack(client, user_headers):
    """POST /api/v1/creative/thumbnails/generate - generates 6 distinct thumbnails."""
    payload = {
        "prompt": "Epic showdown, villain confrontation, danger warning",
        "count": 6,
        "series_title": "Tower of God",
        "genre": "Fantasy",
        "panels": [],
    }
    response = client.post("/api/v1/creative/thumbnails/generate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 6
    assert len(data["thumbnails"]) == 6


def test_generate_thumbnail_custom_aspect_ratio(client, user_headers):
    """POST /api/v1/creative/thumbnails/generate - supports custom aspect ratios like 9:16 vertical."""
    payload = {
        "prompt": "Cyberpunk warrior portrait in neon rain",
        "aspect_ratio": "9:16",
        "series_title": "Neon Samurai",
        "genre": "Cyberpunk",
    }
    response = client.post("/api/v1/creative/thumbnails/generate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 1
    assert len(data["thumbnails"]) == 1
    thumb = data["thumbnails"][0]
    assert thumb["aspect_ratio"] == "9:16"
    assert thumb["width"] == 720
    assert thumb["height"] == 1280

