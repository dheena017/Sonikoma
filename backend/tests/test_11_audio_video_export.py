"""
backend/tests/test_11_audio_video_export.py
─────────────────────────────────────────────────────────────────────────────
Tests for Audio Synthesis, Video Rendering Engine, Jobs & YouTube Export.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_jobs_list_endpoint(client, user_headers):
    """GET /api/v1/jobs/ - retrieves platform background jobs."""
    response = client.get("/api/v1/jobs/", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    assert "jobs" in data
    assert isinstance(data["jobs"], list)


def test_audio_list_tts_voices(client):
    """GET /api/v1/audio/list-tts-voices - returns list of Edge-TTS voices."""
    response = client.get("/api/v1/audio/list-tts-voices")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))


def test_video_render_empty_panels(client):
    """POST /api/v1/video/render - rejects render request when panel list is empty."""
    response = client.post("/api/v1/video/render", json={"panels": []})
    assert response.status_code in (400, 422)


def test_export_youtube_profiles(client, user_headers):
    """GET /api/v1/export/youtube/profiles - returns publishing profiles."""
    response = client.get("/api/v1/export/youtube/profiles", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "profiles" in data


def test_export_youtube_quota(client):
    """GET /api/v1/export/youtube/quota - returns YouTube API daily quota state."""
    response = client.get("/api/v1/export/youtube/quota")
    assert response.status_code in (200, 401)
