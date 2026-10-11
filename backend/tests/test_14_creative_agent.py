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
    """GET /api/v1/creative/agent/status/{run_id} - fetches real-time agent run status and logs."""
    launch_res = client.post(
        "/api/v1/creative/agent/run",
        json={"url": "https://example.com/test", "review_mode": True, "max_panels": 2},
        headers=user_headers,
    )
    assert launch_res.status_code == 200
    run_id = launch_res.json()["run_id"]

    status_res = client.get(f"/api/v1/creative/agent/status/{run_id}", headers=user_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["run_id"] == run_id
    assert "status" in status_data
    assert "logs" in status_data
    assert isinstance(status_data["logs"], list)
    assert len(status_data["logs"]) >= 1


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


def test_stop_creative_agent_endpoint(client, user_headers):
    """POST /api/v1/creative/agent/stop/{run_id} - stops and cancels active run."""
    launch_res = client.post(
        "/api/v1/creative/agent/run",
        json={"url": "https://example.com/stop-test", "review_mode": True, "max_panels": 2},
        headers=user_headers,
    )
    assert launch_res.status_code == 200
    run_id = launch_res.json()["run_id"]

    stop_res = client.post(f"/api/v1/creative/agent/stop/{run_id}", headers=user_headers)
    assert stop_res.status_code == 200
    stop_data = stop_res.json()
    assert stop_data["run_id"] == run_id
    assert stop_data["status"] == "stopped"


def test_restart_creative_agent_endpoint(client, user_headers):
    """POST /api/v1/creative/agent/restart/{run_id} - restarts an agent run from scratch."""
    launch_res = client.post(
        "/api/v1/creative/agent/run",
        json={"url": "https://example.com/restart-test", "review_mode": True, "max_panels": 2},
        headers=user_headers,
    )
    assert launch_res.status_code == 200
    run_id = launch_res.json()["run_id"]

    # Stop it first
    client.post(f"/api/v1/creative/agent/stop/{run_id}", headers=user_headers)

    # Now restart it
    restart_res = client.post(f"/api/v1/creative/agent/restart/{run_id}", headers=user_headers)
    assert restart_res.status_code == 200
    restart_data = restart_res.json()
    assert restart_data["run_id"] == run_id
    assert restart_data["status"] in ("initializing", "scraping", "processing_images", "awaiting_review", "completed")
