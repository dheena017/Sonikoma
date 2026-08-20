"""
backend/tests/test_scrape_images_api.py
─────────────────────────────────────────────────────────────────────────────
Unit tests for the canonical POST /api/v1/scraper/chapter and POST /batch endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from unittest.mock import AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.v1.scraper import scraper_router
from api.dependencies.auth import get_current_user
from database.engine import get_db_connection
from app.schemas.scraper import ScrapeChapterRequest

app = FastAPI()
app.include_router(scraper_router)
client = TestClient(app)

MOCK_USER = {"user_id": "test_user_images_1", "email": "testimages@example.com"}

@pytest.fixture(autouse=True)
def setup_db_and_auth():
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("test_user_images_1", "testuserimages", "testimages@example.com", "hash", "2025-01-01", "2025-01-01")
        )
        conn.commit()
    finally:
        conn.close()

    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.clear()

def test_scrape_chapter_request_schema_defaults():
    req = ScrapeChapterRequest(url="https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123")
    assert req.url == "https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123"
    assert req.limit is None
    assert req.proxy_images is True
    assert req.filter_banners is True

def test_scrape_chapter_empty_url_returns_400():
    response = client.post("/chapter", json={"url": "   "})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

@patch("services.scraper.engine.AdaptiveScraperEngine.scrape_url", new_callable=AsyncMock)
def test_scrape_chapter_successful_response(mock_scrape):
    from services.scraper.models import ChapterResult, SourceInfo, SeriesInfo, ChapterInfo, ImageItem, ScrapeDiagnostics, ScrapeCompleteness
    mock_scrape.return_value = ChapterResult(
        success=True,
        source=SourceInfo(
            original_url="https://example.com/test",
            canonical_url="https://example.com/test",
            domain="example.com",
            platform="generic"
        ),
        series=SeriesInfo(
            title="Test Comic",
            author="Test Author",
            genres=["Fantasy"],
            cover_image="https://example.com/cover.jpg",
            description="Test synopsis"
        ),
        chapter=ChapterInfo(
            number=1,
            title="Chapter 1",
            url="https://example.com/test"
        ),
        images=[
            ImageItem(index=0, url="https://example.com/panel1.jpg", width=800, height=1200, is_new=True)
        ],
        scrape=ScrapeDiagnostics(
            image_count=1,
            new_image_count=1,
            completeness=ScrapeCompleteness.COMPLETE,
            delivery_mechanism="DOM_READER",
            level_used="Level 1"
        )
    )

    payload = {
        "url": "https://www.webtoons.com/en/fantasy/sample/ep-1/viewer?title_no=123",
        "limit": 5,
        "proxy_images": False,
        "filter_banners": True,
    }

    response = client.post("/chapter", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["job_type"].upper() == "SCRAPE_CHAPTER"


def test_batch_scrape_endpoint():
    payload = {
        "urls": ["https://tapas.io/episode/3899239"],
        "limit": 5
    }
    response = client.post("/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert data["job_type"].upper() == "BATCH_SCRAPE"
    assert data["status"].upper() == "QUEUED"
