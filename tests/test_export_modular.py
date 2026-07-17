import sys
import os
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Make sure backend/app is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "app")))

from api.v1.export.router import export_router

def test_export_router_loading():
    """Verify that the modularized export router loads and exposes expected routes via OpenAPI schema."""
    app = FastAPI()
    app.include_router(export_router)
    client = TestClient(app)

    response = client.get("/openapi.json")
    assert response.status_code == 200

    schema = response.json()
    paths = schema.get("paths", {})
    print("Exposed paths in OpenAPI:", list(paths.keys()))

    assert "/youtube" in paths
    assert "/youtube/upload" in paths
    assert "/youtube/profiles" in paths
    assert "/youtube/profiles/{name}" in paths
    assert "/youtube/history" in paths
    assert "/youtube/credentials" in paths
