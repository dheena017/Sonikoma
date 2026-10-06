"""
backend/tests/test_07_projects.py
─────────────────────────────────────────────────────────────────────────────
Tests for Projects & Workspace CRUD, Settings, Panels & Analytics.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import pytest


def test_projects_list_authorized(client, user_headers):
    """GET /api/v1/projects/ - returns project list for authenticated user."""
    response = client.get("/api/v1/projects/", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_project_lifecycle(client, user_headers):
    """Lifecycle test: Create, Fetch, Update Settings, Save Panels, and Delete Project."""
    test_project_id = f"test_proj_{uuid.uuid4().hex[:8]}"

    # 1. Create Project
    create_payload = {
        "project_id": test_project_id,
        "title": "Automated Test Project",
        "url": "https://test.webtoon.example/ep1",
        "genre": "fantasy",
        "episode": "Episode 1",
    }
    create_resp = client.post("/api/v1/projects/", json=create_payload, headers=user_headers)
    assert create_resp.status_code in (200, 201)

    try:
        # 2. Get Project by ID
        get_resp = client.get(f"/api/v1/projects/{test_project_id}", headers=user_headers)
        assert get_resp.status_code == 200
        proj_data = get_resp.json()
        proj_inner = proj_data.get("project", proj_data)
        assert proj_inner.get("id") == test_project_id or proj_inner.get("project_id") == test_project_id

        # 3. Get Project Settings
        settings_resp = client.get(f"/api/v1/projects/{test_project_id}/settings", headers=user_headers)
        assert settings_resp.status_code == 200

        # 4. Save Panels
        panels_payload = {
            "panels": [
                {
                    "image_url": "https://example.com/panel1.jpg",
                    "speech_text": "Hello world from test suite!",
                    "duration": 3.5,
                }
            ]
        }
        panels_resp = client.post(
            f"/api/v1/projects/{test_project_id}/panels",
            json=panels_payload,
            headers=user_headers,
        )
        assert panels_resp.status_code in (200, 201)

    finally:
        # 5. Clean up - Delete Project
        del_resp = client.delete(f"/api/v1/projects/{test_project_id}", headers=user_headers)
        assert del_resp.status_code in (200, 204)


def test_project_analytics_tokens(client, user_headers):
    """GET /api/v1/projects/analytics/tokens - returns token telemetry."""
    response = client.get("/api/v1/projects/analytics/tokens", headers=user_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (dict, list))
