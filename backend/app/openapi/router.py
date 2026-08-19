"""
backend/app/openapi/router.py
─────────────────────────────────────────────────────────────────────────────
Documentation router providing custom Swagger UI consoles and category-filtered
OpenAPI JSON schemas for Sonikoma.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import FastAPI, APIRouter
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import HTMLResponse, JSONResponse

from app.openapi.config import CATEGORY_METADATA
from app.openapi.theme import get_swagger_dark_theme_css, get_swagger_navbar_html

openapi_router = APIRouter()


def get_category_openapi_schema(app: FastAPI, category: str):
    """Filters the OpenAPI schema to include only routes matching the specified category."""
    full_schema = app.openapi()
    if not category or category == "all":
        return full_schema

    cat = category.lower()
    filtered_paths = {}
    valid_tags = set()

    for path, methods in full_schema.get("paths", {}).items():
        match = False
        if cat == "jobs" and "/jobs" in path:
            match = True
        elif cat == "ai" and ("/ai" in path or "/models" in path or "/prompts" in path):
            match = True
        elif cat == "projects" and "/projects" in path:
            match = True
        elif cat == "scraper" and ("/scraper" in path or "/panels" in path or "/ocr" in path or "/storyboard" in path or "/proxy" in path):
            match = True
        elif cat == "media" and ("/image" in path or "/audio" in path or "/video" in path or "/export" in path or "/ffmpeg" in path or "/librosa" in path or "/whisper" in path):
            match = True
        elif cat == "admin" and ("/admin" in path or "/db" in path or "/system" in path):
            match = True
        elif cat == "auth" and ("/auth" in path or "/login" in path or "/register" in path or "/profile" in path or "/api-keys" in path or "/sessions" in path or "/oauth" in path):
            match = True

        if match:
            filtered_paths[path] = methods
            for method_info in methods.values():
                if isinstance(method_info, dict) and "tags" in method_info:
                    valid_tags.update(method_info["tags"])

    return {
        **full_schema,
        "paths": filtered_paths,
        "tags": [t for t in full_schema.get("tags", []) if t["name"] in valid_tags]
    }


def register_docs_routes(app: FastAPI):
    """Registers the interactive documentation endpoints and filtered OpenAPI schemas."""

    @app.get("/api/openapi/{category}.json", include_in_schema=False)
    async def category_openapi_json(category: str):
        schema = get_category_openapi_schema(app, category)
        return JSONResponse(content=schema)

    @app.get("/api/docs", include_in_schema=False)
    @app.get("/api/docs/{category}", include_in_schema=False)
    async def custom_swagger_ui(category: str = "all"):
        category_clean = (category or "all").lower()
        valid_ids = [c["id"] for c in CATEGORY_METADATA]
        if category_clean not in valid_ids:
            category_clean = "all"

        openapi_url = f"/api/openapi/{category_clean}.json" if category_clean != "all" else "/api/openapi.json"
        current_label = next((c["label"] for c in CATEGORY_METADATA if c["id"] == category_clean), "API Console")

        html_res = get_swagger_ui_html(
            openapi_url=openapi_url,
            title=f"Sonikoma - {current_label}",
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
            swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
            swagger_ui_parameters={
                "filter": True,
                "deepLinking": True,
                "displayRequestDuration": True,
                "persistAuthorization": True,
                "docExpansion": "list",
                "defaultModelsExpandDepth": 1,
                "defaultModelExpandDepth": 1,
                "syntaxHighlight.theme": "obsidian",
                "showExtensions": True,
                "showCommonExtensions": True,
                "tryItOutEnabled": True,
            },
        )

        custom_theme_css = get_swagger_dark_theme_css()
        custom_navbar_html = get_swagger_navbar_html(category_clean)

        content = html_res.body.decode("utf-8")
        content = content.replace("</head>", f"{custom_theme_css}</head>")
        content = content.replace("<body>", f"<body>\n{custom_navbar_html}")
        return HTMLResponse(content=content)
