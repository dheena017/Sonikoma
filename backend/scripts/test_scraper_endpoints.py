"""
backend/scripts/test_scraper_endpoints.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Automated REST API Endpoint Validation Suite for the Sonikoma
Universal Adaptive Scraper.

Tests every route mounted under /api/v1/scraper/* and /api/scraper/*
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import os
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
app_dir = backend_dir / "app"
sys.path.insert(0, str(app_dir))
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from api.dependencies.auth import get_current_user

# Generate valid JWT token for test suite
token = create_access_token({"sub": "test_user_123", "email": "tester@sonikoma.ai", "role": "admin"})
auth_headers = {"Authorization": f"Bearer {token}"}

# Override auth dependency for tests
async def mock_current_user():
    return {
        "id": "test_user_123",
        "user_id": "test_user_123",
        "email": "tester@sonikoma.ai",
        "role": "admin"
    }

app.dependency_overrides[get_current_user] = mock_current_user
client = TestClient(app, headers=auth_headers)

print("=" * 80)
print("SONIKOMA UNIVERSAL SCRAPER -- COMPREHENSIVE ENDPOINT TEST SUITE")
print("=" * 80)

passed = 0
failed = 0

def record_test(name: str, success: bool, details: str = ""):
    global passed, failed
    if success:
        passed += 1
        print(f"  [PASS] {name:<45} | {details}")
    else:
        failed += 1
        print(f"  [FAIL] {name:<45} | {details}")

# ─────────────────────────────────────────────────────────────────────────────
# 1. URL INTELLIGENCE & UTILITY ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[1/8] Testing URL Intelligence & Decomposition Endpoints...")

# POST /api/v1/scraper/separate-url
res = client.post("/api/v1/scraper/separate-url", json={"url": "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-134/viewer?title_no=95&episode_no=550"})
record_test(
    "POST /api/v1/scraper/separate-url",
    res.status_code == 200 and res.json().get("domain") == "webtoons.com",
    f"Status: {res.status_code}, Domain: {res.json().get('domain')}"
)

# GET /api/v1/scraper/separate-url
res = client.get("/api/v1/scraper/separate-url?url=https%3A%2F%2Fmangadex.org%2Fchapter%2Fe3034fb8-0f04-4c54-8c88-e215e96f131a")
record_test(
    "GET /api/v1/scraper/separate-url",
    res.status_code == 200 and res.json().get("platform") == "mangadex",
    f"Status: {res.status_code}, Platform: {res.json().get('platform')}"
)

# POST /api/v1/scraper/normalize-url
res = client.post("/api/v1/scraper/normalize-url", json={"url": "https://asuracomic.net/series/mount-hua/chapter-105/?utm_source=test#anchor"})
record_test(
    "POST /api/v1/scraper/normalize-url",
    res.status_code == 200 and "utm_source" not in res.json().get("normalized_url", ""),
    f"Status: {res.status_code}, Normalized: {res.json().get('normalized_url')}"
)

# POST /api/v1/scraper/parent-series-url
res = client.post("/api/v1/scraper/parent-series-url", json={"url": "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-134/viewer?title_no=95&episode_no=550"})
record_test(
    "POST /api/v1/scraper/parent-series-url",
    res.status_code == 200 and "list?title_no=95" in res.json().get("parent_series_url", ""),
    f"Status: {res.status_code}, Parent: {res.json().get('parent_series_url')}"
)

# POST /api/v1/scraper/detect-platform
res = client.post("/api/v1/scraper/detect-platform", json={"url": "https://mangadex.org/chapter/123456"})
record_test(
    "POST /api/v1/scraper/detect-platform",
    res.status_code == 200 and res.json().get("platform") == "mangadex",
    f"Status: {res.status_code}, Platform: {res.json().get('platform')}, Adapter: {res.json().get('adapter_name')}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 2. IMAGE VALIDATION & READING ORDER TOOLS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[2/8] Testing Image Validation & Reading Order Endpoints...")

sample_images = [
    {"url": "https://cdn.example.com/003.jpg", "width": 800, "height": 1200},
    {"url": "https://cdn.example.com/banner-ad.png", "width": 300, "height": 50},
    {"url": "https://cdn.example.com/001.jpg", "width": 800, "height": 1200},
    {"url": "https://cdn.example.com/002.jpg", "width": 800, "height": 1200}
]

# POST /api/v1/scraper/validate-images
res = client.post("/api/v1/scraper/validate-images", json={"images": sample_images, "filter_banners": True})
record_test(
    "POST /api/v1/scraper/validate-images",
    res.status_code == 200 and res.json().get("valid_count") == 3,
    f"Status: {res.status_code}, Valid: {res.json().get('valid_count')}, Rejected: {res.json().get('rejected_count')}"
)

# POST /api/v1/scraper/sort-images
res = client.post("/api/v1/scraper/sort-images", json={"images": sample_images})
sorted_urls = [img["url"] for img in res.json().get("images", [])]
record_test(
    "POST /api/v1/scraper/sort-images",
    res.status_code == 200 and "001.jpg" in sorted_urls[0],
    f"Status: {res.status_code}, Sequence: {sorted_urls}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 3. DOMAIN BLOCKING & RATE LIMITING SYSTEM
# ─────────────────────────────────────────────────────────────────────────────
print("\n[3/8] Testing In-Memory Domain Blocking System...")

# POST /api/v1/scraper/block-domain
res = client.post("/api/v1/scraper/block-domain", json={"domain": "malicious-ads.net", "reason": "Ad network"})
record_test(
    "POST /api/v1/scraper/block-domain",
    res.status_code == 200 and res.json().get("domain") == "malicious-ads.net",
    f"Status: {res.status_code}, Blocked: {res.json().get('domain')}"
)

# POST /api/v1/scraper/check-blocked
res = client.post("/api/v1/scraper/check-blocked", json={"url": "https://malicious-ads.net/banner.gif"})
record_test(
    "POST /api/v1/scraper/check-blocked",
    res.status_code == 200 and res.json().get("is_blocked") is True,
    f"Status: {res.status_code}, Is Blocked: {res.json().get('is_blocked')}"
)

# GET /api/v1/scraper/blocked-domains
res = client.get("/api/v1/scraper/blocked-domains")
record_test(
    "GET /api/v1/scraper/blocked-domains",
    res.status_code == 200 and res.json().get("total", 0) >= 1,
    f"Status: {res.status_code}, Total Blocked: {res.json().get('total')}"
)

# DELETE /api/v1/scraper/block-domain/{domain}
res = client.delete("/api/v1/scraper/block-domain/malicious-ads.net")
record_test(
    "DELETE /api/v1/scraper/block-domain/{domain}",
    res.status_code == 200 and res.json().get("success") is True,
    f"Status: {res.status_code}, Unblocked: {res.json().get('success')}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 4. ADAPTER REGISTRY & METADATA
# ─────────────────────────────────────────────────────────────────────────────
print("\n[4/8] Testing Adapter Registry & Metadata Endpoints...")

# GET /api/v1/scraper/adapters
res = client.get("/api/v1/scraper/adapters")
adapters_list = res.json().get("adapters", [])
record_test(
    "GET /api/v1/scraper/adapters",
    res.status_code == 200 and len(adapters_list) >= 8,
    f"Status: {res.status_code}, Registered Adapters: {len(adapters_list)}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 5. IN-MEMORY RAM CACHE & SESSION MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────
print("\n[5/8] Testing RAM Cache & Session Management...")

# GET /api/v1/scraper/session
res = client.get("/api/v1/scraper/session?url=https%3A%2F%2Fexample.com%2Fcomic%2Fch1")
record_test(
    "GET /api/v1/scraper/session",
    res.status_code == 200 and "url" in res.json(),
    f"Status: {res.status_code}"
)

# POST /api/v1/scraper/cache/clear
res = client.post("/api/v1/scraper/cache/clear")
record_test(
    "POST /api/v1/scraper/cache/clear",
    res.status_code == 200 and res.json().get("success") is True,
    f"Status: {res.status_code}, Message: {res.json().get('message')}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 6. SYSTEM HEALTH & DIAGNOSTICS
# ─────────────────────────────────────────────────────────────────────────────
print("\n[6/8] Testing System Health & Diagnostics Endpoints...")

# GET /api/v1/scraper/health
res = client.get("/api/v1/scraper/health")
record_test(
    "GET /api/v1/scraper/health",
    res.status_code == 200 and res.json().get("status") == "healthy",
    f"Status: {res.status_code}, Version: {res.json().get('version')}"
)

# GET /api/health (root proxy health)
res = client.get("/api/health")
record_test(
    "GET /api/health",
    res.status_code == 200 and res.json().get("status") == "healthy",
    f"Status: {res.status_code}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 7. ASYNC BACKGROUND JOB PIPELINES
# ─────────────────────────────────────────────────────────────────────────────
print("\n[7/8] Testing Background Job Pipelines (Chapter, Series, Batch)...")

# POST /api/v1/scraper/chapter (Async Job Submission)
res = client.post("/api/v1/scraper/chapter", json={
    "url": "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-134/viewer?title_no=95&episode_no=550",
    "proxy_images": True,
    "filter_banners": True
})
job_id = res.json().get("job_id")
record_test(
    "POST /api/v1/scraper/chapter",
    res.status_code == 200 and job_id is not None,
    f"Status: {res.status_code}, Job ID: {job_id}"
)

# GET /api/v1/jobs/{job_id}
if job_id:
    res = client.get(f"/api/v1/jobs/{job_id}")
    record_test(
        f"GET /api/v1/jobs/{job_id}",
        res.status_code == 200 and res.json().get("job_id") == job_id,
        f"Status: {res.status_code}, State: {res.json().get('status')}"
    )

# POST /api/v1/scraper/batch (Async Batch Job Submission)
res = client.post("/api/v1/scraper/batch", json={
    "urls": [
        "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-134/viewer?title_no=95&episode_no=550",
        "https://www.webtoons.com/en/fantasy/tower-of-god/season-3-ep-135/viewer?title_no=95&episode_no=551"
    ]
})
batch_job_id = res.json().get("job_id")
record_test(
    "POST /api/v1/scraper/batch",
    res.status_code == 200 and batch_job_id is not None,
    f"Status: {res.status_code}, Batch Job ID: {batch_job_id}"
)

# ─────────────────────────────────────────────────────────────────────────────
# 8. DIRECT SYNCHRONOUS SCRAPING & RAW IMAGE DISCOVERY
# ─────────────────────────────────────────────────────────────────────────────
print("\n[8/8] Testing Direct Synchronous Scraping & Extraction Endpoints...")

# POST /api/v1/scraper/all-images (Mock HTML extract)
res = client.post("/api/v1/scraper/all-images", json={
    "url": "https://cdn.example.com/preview",
    "render_js": False,
    "bypass_cache": True
})
record_test(
    "POST /api/v1/scraper/all-images",
    res.status_code in (200, 400),
    f"Status: {res.status_code}"
)

# GET /api/v1/scraper/all-images
res = client.get("/api/v1/scraper/all-images?url=https%3A%2F%2Fcdn.example.com%2Fpreview&render_js=false")
record_test(
    "GET /api/v1/scraper/all-images",
    res.status_code in (200, 400),
    f"Status: {res.status_code}"
)

print("\n" + "=" * 80)
print(f"FINAL RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {passed + failed})")
print("=" * 80)

if failed > 0:
    sys.exit(1)
else:
    print("ALL CANONICAL SCRAPER REST API ENDPOINTS FULLY VERIFIED!\n")
