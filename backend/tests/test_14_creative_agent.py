"""
backend/tests/test_14_creative_agent.py
─────────────────────────────────────────────────────────────────────────────
Tests for the Autonomous Creative AI Agent:
- POST /api/v1/creative/agent/run
- GET /api/v1/creative/agent/status/{run_id}
- POST /api/v1/creative/agent/approve/{run_id}
- GET /api/v1/creative/agent/history
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_launch_creative_agent_endpoint(client, user_headers):
    """POST /api/v1/creative/agent/run - launches autonomous 1-click agent pipeline."""
    payload = {
        "url": "https://example.com/webtoon/chapter/1",
        "video_format": "shorts",
        "language": "en",
        "voice": "alloy",
        "privacy_status": "unlisted",
        "review_mode": True,
        "max_panels": 4,
        "title_override": "Demon King Awakening",
    }
    response = client.post("/api/v1/creative/agent/run", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert data["run_id"].startswith("ag_")
    assert data["status"] in ("initializing", "scraping", "processing_images", "awaiting_review", "completed")
    assert "logs" in data
    assert isinstance(data["logs"], list)


def test_get_creative_agent_status_endpoint(client, user_headers):
    """GET /api/v1/creative/agent/status/{run_id} - fetches real-time agent status."""
    payload = {
        "url": "https://example.com/webtoon/chapter/1",
        "video_format": "landscape",
        "review_mode": True,
        "max_panels": 3,
    }
    launch_res = client.post("/api/v1/creative/agent/run", json=payload, headers=user_headers)
    assert launch_res.status_code == 200
    run_id = launch_res.json()["run_id"]

    status_res = client.get(f"/api/v1/creative/agent/status/{run_id}", headers=user_headers)
    assert status_res.status_code == 200
    state = status_res.json()
    assert state["run_id"] == run_id
    assert "progress" in state
    assert "current_action" in state


def test_approve_creative_agent_endpoint(client, user_headers):
    """POST /api/v1/creative/agent/approve/{run_id} - approves review checkpoint."""
    payload = {
        "url": "https://example.com/webtoon/chapter/1",
        "review_mode": True,
        "max_panels": 2,
    }
    launch_res = client.post("/api/v1/creative/agent/run", json=payload, headers=user_headers)
    assert launch_res.status_code == 200
    run_id = launch_res.json()["run_id"]

    approve_res = client.post(
        f"/api/v1/creative/agent/approve/{run_id}",
        json={"title_override": "Approved Title", "privacy_status": "unlisted"},
        headers=user_headers,
    )
    assert approve_res.status_code == 200
    approved_state = approve_res.json()
    assert approved_state["run_id"] == run_id


def test_get_creative_agent_history_endpoint(client, user_headers):
    """GET /api/v1/creative/agent/history - lists previous agent execution runs."""
    response = client.get("/api/v1/creative/agent/history", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "runs" in data
    assert isinstance(data["runs"], list)
    assert "total" in data


def test_launch_creative_agent_all_panels_endpoint(client, user_headers):
    """POST /api/v1/creative/agent/run - launches agent without max_panels to use all panels."""
    payload = {
        "url": "https://example.com/webtoon/chapter/1",
        "video_format": "shorts",
        "review_mode": True,
    }
    response = client.post("/api/v1/creative/agent/run", json=payload, headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert data["status"] in ("initializing", "scraping", "processing_images", "awaiting_review", "completed")
