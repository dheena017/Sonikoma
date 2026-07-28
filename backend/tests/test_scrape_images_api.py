"""
backend/tests/test_scrape_images_api.py
─────────────────────────────────────────────────────────────────────────────
Unit tests for the enhanced POST /api/v1/scraper/scrape-images endpoint.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.v1.scraper import scraper_router
from app.schemas.scraper import ScrapeImagesRequest

app = FastAPI()
app.include_router(scraper_router)
client = TestClient(app)

def test_scrape_images_request_schema_defaults():
    req = ScrapeImagesRequest(url="https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123")
    assert req.url == "https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123"
    assert req.limit is None
    assert req.proxy_images is True
    assert req.filter_banners is True
    assert req.include_metadata is True

def test_scrape_images_empty_url_returns_400():
    response = client.post("/scrape-images", json={"url": "   "})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

@patch("api.v1.scraper.scrape_and_initialize_project", new_callable=AsyncMock)
def test_scrape_images_successful_response(mock_scrape):
    mock_scrape.return_value = {
        "success": True,
        "project_id": "temp_12345",
        "title": "Test Comic",
        "genre": "fantasy",
        "episode": "Chapter 1",
        "author": "Test Author",
        "cover_image": "https://example.com/cover.jpg",
        "synopsis": "Test synopsis",
        "images": ["/api/proxy-image?url=https%3A%2F%2Fexample.com%2Fpanel1.jpg"],
        "total_images": 1,
        "execution_time_ms": 45.2,
        "metadata": {
            "title": "Test Comic",
            "genre": "fantasy",
            "episode": "Chapter 1",
            "author": "Test Author",
            "cover_image": "https://example.com/cover.jpg",
            "synopsis": "Test synopsis"
        },
        "debug": {
            "cache": "MISS",
            "smart_slice": True,
            "proxy_images": False,
            "filter_banners": True,
            "limit": 5
        }
    }

    payload = {
        "url": "https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123",
        "scrape_only": True,
        "limit": 5,
        "proxy_images": False,
        "filter_banners": True,
        "include_metadata": True
    }

    response = client.post("/scrape-images", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_images"] == 1
    assert "metadata" in data
    assert data["debug"]["limit"] == 5

    mock_scrape.assert_called_once()
    kwargs = mock_scrape.call_args.kwargs
    assert kwargs["limit"] == 5
    assert kwargs["proxy_images"] is False
    assert kwargs["filter_banners"] is True
