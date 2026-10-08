"""
backend/tests/test_16_creative_translation.py
─────────────────────────────────────────────────────────────────────────────
Tests for the Autonomous Creative Translation & Localization Feature:
- POST /api/v1/creative/translation/translate
- POST /api/v1/creative/translation/batch-translate
- POST /api/v1/ai/skills/translate
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_creative_translation_endpoint(client, user_headers):
    """POST /api/v1/creative/translation/translate - translates single comic dialogue."""
    payload = {
        "text": "Stop right there! You cannot pass this gate!",
        "target_lang": "Japanese",
        "tone": "shonen",
    }
    response = client.post("/api/v1/creative/translation/translate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "result" in data
    assert "translated_text" in data["result"]
    assert len(data["result"]["translated_text"]) > 0


def test_creative_batch_translation_endpoint(client, user_headers):
    """POST /api/v1/creative/translation/batch-translate - batch translates panel dialogues."""
    payload = {
        "items": [
            {"id": "p1", "text": "He awakens the dark seal."},
            {"id": "p2", "text": "Run before it consumes everything!"},
        ],
        "default_target_lang": "Spanish",
        "default_tone": "natural",
    }
    response = client.post("/api/v1/creative/translation/batch-translate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "results" in data
    assert len(data["results"]) == 2
    assert "translated_text" in data["results"][0]


def test_ai_skill_translate_compat_endpoint(client, user_headers):
    """POST /api/v1/ai/skills/translate - legacy compatibility route using moved skill."""
    payload = {
        "text": "I have unlocked the hidden technique.",
        "target_lang": "Korean",
    }
    response = client.post("/api/v1/ai/skills/translate", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "translated_text" in data or "result" in data
