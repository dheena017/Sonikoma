"""
backend/tests/test_ai_scraper_orchestrator.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Unit Tests for Autonomous AI Scraper Orchestration,
Self-Healing Domain Memory, and Zero-Hardcoding State Tree Parsers.
─────────────────────────────────────────────────────────────────────────────
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from services.scraper.ai import (
    ScraperAIOrchestrator,
    UniversalComicBlueprint,
    DomainMemory,
    StitcherDescrambler
)
from services.scraper.extraction.embedded_state import EmbeddedStateExtractor
from services.scraper.engine import AdaptiveScraperEngine


def test_universal_comic_blueprint_model():
    """Validates UniversalComicBlueprint model instantiation and serialization."""
    bp = UniversalComicBlueprint(
        series_title="Solo Leveling",
        series_slug="solo-leveling",
        author="Chugong",
        artist="DUBU",
        publisher="Kakao",
        status="Completed",
        genres=["Action", "Fantasy"],
        tags=["Dungeon", "Monsters"],
        synopsis="In a world where hunters must battle deadly monsters...",
        cover_image_url="https://example.com/cover.jpg",
        chapter_number=150.0,
        chapter_title="Chapter 150 - Monarch of Shadows",
        worker_strategy="DOM_DIRECT",
        container_selector="#readerarea",
        image_src_attribute="data-src"
    )
    assert bp.series_title == "Solo Leveling"
    assert bp.chapter_number == 150.0
    assert bp.genres == ["Action", "Fantasy"]
    assert bp.worker_strategy == "DOM_DIRECT"


def test_domain_memory_crud_and_self_healing():
    """Tests SQLite DomainMemory storage, retrieval, and self-healing error count."""
    bp = UniversalComicBlueprint(
        series_title="Test Series",
        worker_strategy="STATE_JSON",
        container_selector=".chapter-content",
        image_src_attribute="src"
    )
    test_domain = "comic-test-domain.org"

    # Save to memory
    DomainMemory.save_blueprint(test_domain, bp)

    # Retrieve from memory
    retrieved = DomainMemory.get_blueprint(test_domain)
    assert retrieved is not None
    assert retrieved.series_title == "Test Series"
    assert retrieved.worker_strategy == "STATE_JSON"

    # Record failures
    DomainMemory.record_failure(test_domain)
    DomainMemory.record_failure(test_domain)
    DomainMemory.record_failure(test_domain)

    # Threshold reached -> marked stale for self-healing
    stale_check = DomainMemory.get_blueprint(test_domain)
    assert stale_check is None


def test_embedded_state_extractor():
    """Tests EmbeddedStateExtractor with arbitrary nested JSON hydration trees."""
    complex_html = """
    <!DOCTYPE html>
    <html>
    <head><title>Arbitrary SPA Reader</title></head>
    <body>
      <script type="application/json">
        {
          "app": {
            "view": {
              "payload": {
                "custom_chapter_data": {
                  "pages": [
                    "https://cdn.manga.io/p1.webp",
                    "https://cdn.manga.io/p2.webp",
                    "https://cdn.manga.io/p3.webp"
                  ]
                }
              }
            }
          }
        }
      </script>
    </body>
    </html>
    """
    candidates = EmbeddedStateExtractor.extract_from_html(complex_html, "https://manga.io/read/ch1")
    assert len(candidates) == 3
    assert candidates[0].url == "https://cdn.manga.io/p1.webp"
    assert candidates[1].url == "https://cdn.manga.io/p2.webp"
    assert candidates[2].url == "https://cdn.manga.io/p3.webp"


@pytest.mark.anyio
async def test_adaptive_engine_with_ai_blueprint_mock():
    """Tests full AdaptiveScraperEngine integration with AI Blueprint generation."""
    mock_bp = UniversalComicBlueprint(
        series_title="AI Discovered Comic",
        series_slug="ai-comic",
        author="Great Author",
        chapter_number=12.0,
        chapter_title="Ep. 12 - Revelations",
        worker_strategy="DOM_DIRECT",
        container_selector=".custom-ai-container"
    )

    html = """
    <html>
    <head><title>Comic Viewer</title></head>
    <body>
      <div class="custom-ai-container">
        <img src="https://example.com/panel1.jpg" />
        <img src="https://example.com/panel2.jpg" />
        <img src="https://example.com/panel3.jpg" />
      </div>
    </body>
    </html>
    """

    with patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_fetch, \
         patch("services.scraper.ai.orchestrator_scraper.ScraperAIOrchestrator.analyze_page", new_callable=AsyncMock) as mock_ai:
        
        mock_fetch.return_value = (html, 200, 15.0)
        mock_ai.return_value = mock_bp

        result = await AdaptiveScraperEngine.scrape_url("https://ai-tested-comic.com/ch12")
        assert result.success is True
        assert result.series.title == "AI Discovered Comic"
        assert result.chapter.number == 12.0
        assert len(result.images) == 3
        assert result.images[0].url == "https://example.com/panel1.jpg"


@pytest.mark.anyio
async def test_ai_analyze_endpoint_api():
    """Tests the /api/v1/scraper/ai/analyze direct testing endpoint."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from api.router import api_router
    from api.dependencies.auth import get_current_user
    from database.engine import get_db_connection

    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("test_ai_user", "aiuser", "ai@test.com", "hash", "2025-01-01", "2025-01-01")
        )
        conn.commit()
    finally:
        conn.close()

    mock_bp = UniversalComicBlueprint(
        series_title="Endpoint Comic Test",
        author="API Author",
        chapter_number=1.0,
        worker_strategy="DOM_DIRECT",
        container_selector="#reader"
    )

    test_app = FastAPI()
    test_app.include_router(api_router)
    test_app.dependency_overrides[get_current_user] = lambda: {"user_id": "test_ai_user", "email": "ai@test.com"}
    client = TestClient(test_app)

    with patch("services.scraper.ai.orchestrator_scraper.ScraperAIOrchestrator.analyze_page", new_callable=AsyncMock) as mock_ai, \
         patch("services.scraper.acquisition.http.HttpFetcher.fetch_html", new_callable=AsyncMock) as mock_fetch:
        
        mock_ai.return_value = mock_bp
        mock_fetch.return_value = ("<div id='reader'><img src='http://cdn.com/1.jpg' /></div>", 200, 10.0)

        resp = client.post(
            "/api/v1/scraper/ai/analyze",
            json={"url": "https://test-blueprint.org/ch1", "bypass_cache": True}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["job_id"] is not None
        assert data["blueprint"]["series_title"] == "Endpoint Comic Test"
        assert data["blueprint"]["worker_strategy"] == "DOM_DIRECT"
        assert data["blueprint"]["container_selector"] == "#reader"


@pytest.mark.anyio
async def test_admin_domain_management_routes_api():
    """Tests the full CRUD lifecycle of Admin Domain Management API."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from api.router import api_router
    from api.dependencies.auth import get_current_user

    test_app = FastAPI()
    test_app.include_router(api_router)
    test_app.dependency_overrides[get_current_user] = lambda: {"user_id": "test_ai_user", "email": "admin@test.com"}
    client = TestClient(test_app)

    # 1. List Domains
    resp = client.get("/api/v1/scraper/admin/domains")
    assert resp.status_code == 200
    data = resp.json()
    assert "domains" in data
    assert isinstance(data["domains"], list)

    # 2. Submit Domain Request
    resp = client.post(
        "/api/v1/scraper/admin/domains/request",
        json={"url": "https://new-scanlation-site.org/manga/ch1", "notes": "Please add this novel site"}
    )
    assert resp.status_code == 200
    req_data = resp.json()
    assert req_data["success"] is True
    assert req_data["domain"] == "new-scanlation-site.org"
    assert req_data["status"] == "pending"

    # 3. Update Status to Approved
    resp = client.post(
        "/api/v1/scraper/admin/domains/new-scanlation-site.org/status",
        json={"status": "approved", "notes": "Approved by admin"}
    )
    assert resp.status_code == 200
    up_data = resp.json()
    assert up_data["success"] is True
    assert up_data["status"] == "approved"

    # 4. Verify Approved Status in List
    resp = client.get("/api/v1/scraper/admin/domains?status=approved")
    assert resp.status_code == 200
    approved_domains = [d["domain"] for d in resp.json()["domains"]]
    assert "new-scanlation-site.org" in approved_domains

    # 5. Delete Domain
    resp = client.delete("/api/v1/scraper/admin/domains/new-scanlation-site.org")
    assert resp.status_code == 200
    del_data = resp.json()
    assert del_data["success"] is True

    # 6. Verify Deletion
    status = DomainMemory.get_domain_status("new-scanlation-site.org")
    assert status == "unregistered"
