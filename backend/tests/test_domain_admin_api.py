import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.router import api_router
from api.dependencies.auth import get_current_user
from database.engine import get_db_connection
from services.scraper.ai.domain_memory import DomainMemory

app = FastAPI()
app.include_router(api_router)

MOCK_USER = {"user_id": "test_user_123", "email": "admin@example.com"}


@pytest.fixture(autouse=True)
def setup_db_and_auth():
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO users (id, username, email, password_hash, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            ("test_user_123", "testadmin", "admin@example.com", "hash", "2025-01-01", "2025-01-01")
        )
        conn.commit()
    finally:
        conn.close()

    app.dependency_overrides[get_current_user] = lambda: MOCK_USER
    yield
    app.dependency_overrides.clear()
    # Cleanup test domain
    DomainMemory.delete_domain("comicsite.example")


def test_admin_domain_lifecycle():
    client = TestClient(app)

    # 1. Request onboarding of a new domain
    req_res = client.post(
        "/api/v1/scraper/admin/domains/request",
        json={
            "url": "https://comicsite.example/manga/super-hero/ch1",
            "notes": "Popular comic requested by community"
        }
    )
    assert req_res.status_code == 200
    data = req_res.json()
    assert data["success"] is True
    assert data["domain"] == "comicsite.example"
    assert data["status"] == "pending"

    # 2. List pending domains
    list_res = client.get("/api/v1/scraper/admin/domains?status=pending")
    assert list_res.status_code == 200
    list_data = list_res.json()
    pending_domains = [d["domain"] for d in list_data["domains"]]
    assert "comicsite.example" in pending_domains

    # 3. Update status to approved with a blueprint
    status_res = client.post(
        "/api/v1/scraper/admin/domains/comicsite.example/status",
        json={
            "status": "approved",
            "notes": "Verified and active",
            "blueprint": {
                "container_selector": "#manga_reader_images",
                "image_url_pattern": "https://cdn\\.comicsite\\.example/.*\\.webp",
                "worker_strategy": "FAST_HTML"
            }
        }
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "approved"

    # 4. Verify domain is now approved in DomainMemory
    status = DomainMemory.get_domain_status("https://comicsite.example/manga/1")
    assert status == "approved"

    # 5. Block the domain
    block_res = client.post(
        "/api/v1/scraper/admin/domains/comicsite.example/status",
        json={"status": "blocked"}
    )
    assert block_res.status_code == 200
    assert DomainMemory.get_domain_status("https://comicsite.example/manga/1") == "blocked"

    # 6. Delete domain record
    del_res = client.delete("/api/v1/scraper/admin/domains/comicsite.example")
    assert del_res.status_code == 200
    assert DomainMemory.get_domain_status("https://comicsite.example/manga/1") == "unregistered"

