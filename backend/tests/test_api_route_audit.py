from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_openapi_has_no_duplicated_domain_prefixes():
    routes = [route.path for route in app.routes if hasattr(route, "path")]

    forbidden = [
        "/api/v1/jobs/jobs/{job_id}",
        "/api/v1/panels/panels/split",
        "/api/v1/ocr/ocr/extract",
        "/api/v1/storyboard/storyboard/generate",
        "/api/v1/scraper/scraper/chapter",
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
    ]

    for route in required:
        assert any(candidate == route for candidate in routes), f"Canonical route missing: {route}"
