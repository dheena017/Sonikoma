from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_openapi_has_no_duplicated_domain_prefixes():
    openapi_schema = app.openapi()
    routes = list(openapi_schema.get("paths", {}).keys())

    forbidden = [
        "/api/v1/jobs/jobs/{job_id}",
        "/api/v1/panels/panels/split",
        "/api/v1/ocr/ocr/extract",
        "/api/v1/storyboard/storyboard/generate",
        "/api/v1/scraper/scraper/chapter",
        "/api/v1/ai/ai/models/catalog",
        "/api/v1/ai/ai/providers",
        "/api/v1/ai/ai/analytics/summary",
    ]

    for route in forbidden:
        assert route not in routes, f"Duplicate domain route leaked into OpenAPI: {route}"

    required = [
        "/api/v1/jobs/{job_id}",
        "/api/v1/jobs/{job_id}/cancel",
        "/api/v1/panels/split",
        "/api/v1/scraper/chapter",
        "/api/v1/storyboard/generate",
        "/api/v1/ocr/extract",
        "/api/v1/ai/models/catalog",
        "/api/v1/ai/models/routing",
        "/api/v1/ai/providers",
    ]

    for route in required:
        assert any(candidate == route for candidate in routes), f"Canonical route missing: {route}"


def test_no_consecutive_duplicate_path_segments():
    """Automated audit that scans all 200+ routes in the OpenAPI schema to guarantee no path has repeated segments (e.g. /ai/ai, /jobs/jobs, etc.)."""
    openapi_schema = app.openapi()
    routes = list(openapi_schema.get("paths", {}).keys())

    for route in routes:
        segments = [s for s in route.strip("/").split("/") if s]
        for i in range(len(segments) - 1):
            seg1, seg2 = segments[i], segments[i + 1]
            assert seg1 != seg2, f"Detected consecutive duplicate segment in route: '{route}' (repeated '{seg1}')"


def test_category_openapi_endpoints_are_public():
    """Verify that all category OpenAPI schema JSONs are publicly accessible without authentication errors."""
    categories = ["projects", "jobs", "ai", "scraper", "media", "auth", "admin"]
    for cat in categories:
        res = client.get(f"/api/openapi/{cat}.json")
        assert res.status_code == 200, f"Category openapi schema failed for '{cat}': {res.status_code} {res.text}"
        data = res.json()
        assert "paths" in data
        assert "openapi" in data


