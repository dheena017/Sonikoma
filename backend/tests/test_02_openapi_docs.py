"""
backend/tests/test_02_openapi_docs.py
─────────────────────────────────────────────────────────────────────────────
Tests for OpenAPI JSON Schemas, Swagger UI, ReDoc, and Test Portals.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest


def test_root_openapi_json(client):
    """GET /api/v1/openapi.json - returns complete OpenAPI 3.x schema."""
    response = client.get("/api/v1/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
    assert schema["info"]["title"] == "Sonikoma API Engine"
    assert "paths" in schema
    assert len(schema["paths"]) > 50


@pytest.mark.parametrize("category", [
    "projects",
    "scraper",
    "auth",
    "ai",
    "system",
    "admin",
    "images",
    "audio",
])
def test_category_openapi_json(client, category):
    """GET /api/v1/openapi/{category}.json - returns category-scoped OpenAPI schemas."""
    response = client.get(f"/api/v1/openapi/{category}.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "paths" in schema
    assert "info" in schema


def test_swagger_ui_endpoints(client):
    """GET /api/v1/docs - returns interactive Swagger UI console."""
    response = client.get("/api/v1/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "swagger" in response.text.lower() or "sonikoma" in response.text.lower()


def test_swagger_category_ui(client):
    """GET /api/v1/docs/{category} - returns category-specific Swagger UI."""
    response = client.get("/api/v1/docs/projects")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")


def test_redoc_ui_endpoints(client):
    """GET /api/v1/redoc - returns ReDoc API documentation."""
    response = client.get("/api/v1/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers.get("content-type", "")
    assert "redoc" in response.text.lower()


def test_testing_portal_endpoints(client):
    """GET /api/v1/tests - returns built-in test portal and documentation runner."""
    for path in ["/api/v1/tests", "/api/v1/docs/tests", "/test-portal"]:
        response = client.get(path)
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
