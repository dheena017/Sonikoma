"""
backend/app/openapi/router.py
─────────────────────────────────────────────────────────────────────────────
Documentation router providing custom Swagger UI consoles and category-filtered
OpenAPI JSON schemas for Sonikoma.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import FastAPI, APIRouter
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from fastapi.responses import HTMLResponse, JSONResponse

from app.core.security import create_access_token
from app.openapi.config import CATEGORY_METADATA
from app.openapi.theme import (
    get_swagger_dark_theme_css,
    get_swagger_navbar_html,
    get_schemas_explorer_html,
    get_redoc_custom_html,
    get_test_portal_html,
)

openapi_router = APIRouter()


def setup_custom_openapi(app: FastAPI):
    """Configures OpenAPI schema with JWT Bearer and OAuth2 security schemes for Swagger UI."""
    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        openapi_schema = get_openapi(
            title=app.title,
            version=app.version,
            openapi_version=app.openapi_version,
            description=app.description,
            routes=app.routes,
            tags=app.openapi_tags,
            servers=app.servers,
            terms_of_service=app.terms_of_service,
            contact=app.contact,
            license_info=app.license_info,
        )
        openapi_schema.setdefault("components", {})
        openapi_schema["components"]["securitySchemes"] = {
            "OAuth2PasswordBearer": {
                "type": "oauth2",
                "flows": {
                    "password": {
                        "tokenUrl": "/api/v1/auth/token",
                        "scopes": {},
                    }
                },
                "description": "Login directly with your username or email and password to authorize Swagger UI.",
            },
            "HTTPBearer": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "Enter JWT Bearer access token directly.",
            },
        }
        openapi_schema["security"] = [
            {"OAuth2PasswordBearer": []},
            {"HTTPBearer": []},
        ]
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = custom_openapi


def get_category_openapi_schema(app: FastAPI, category: str):
    """Filters the OpenAPI schema to include only routes matching the specified category."""
    full_schema = app.openapi()
    if not category or category == "all":
        return full_schema

    cat = category.lower()
    if cat == "schemas":
        return {
            **full_schema,
            "paths": {},
            "tags": [],
            "components": full_schema.get("components", {}),
            "security": full_schema.get("security", []),
        }

    filtered_paths = {}
    valid_tags = set()

    for path, methods in full_schema.get("paths", {}).items():
        match = False
        if cat == "auth" and ("/auth" in path or "/login" in path or "/register" in path or "/profile" in path or "/api-keys" in path or "/sessions" in path or "/oauth" in path or "/user" in path):
            match = True
        elif cat == "projects" and ("/projects" in path or "/series" in path or "/chapters" in path):
            match = True
        elif cat == "scraper" and ("/scraper" in path or "/proxy" in path):
            match = True
        elif cat == "panels" and ("/panels" in path or "/ocr" in path):
            match = True
        elif cat == "ai" and ("/ai" in path or "/models" in path or "/prompts" in path or "/storyboard" in path):
            match = True
        elif cat == "audio" and ("/audio" in path or "/tts" in path or "/voice" in path or "/sound" in path):
            match = True
        elif cat == "video" and ("/video" in path or "/render" in path or "/images" in path or "/image" in path):
            match = True
        elif cat == "jobs" and "/jobs" in path:
            match = True
        elif cat == "export" and "/export" in path:
            match = True
        elif cat == "system" and ("/system" in path or "/health" in path or "/telemetry" in path or "/stats" in path):
            match = True
        elif cat == "admin" and ("/admin" in path or "/db" in path or "/system" in path):
            match = True

        if match:
            path_methods = {}
            for method, method_info in methods.items():
                if isinstance(method_info, dict):
                    cloned_info = dict(method_info)
                    cloned_info.setdefault("security", [{"OAuth2PasswordBearer": []}, {"HTTPBearer": []}])
                    path_methods[method] = cloned_info
                    if "tags" in cloned_info:
                        valid_tags.update(cloned_info["tags"])
                else:
                    path_methods[method] = method_info
            filtered_paths[path] = path_methods

    return {
        **full_schema,
        "paths": filtered_paths,
        "tags": [t for t in full_schema.get("tags", []) if t["name"] in valid_tags],
        "components": full_schema.get("components", {}),
        "security": full_schema.get("security", [{"OAuth2PasswordBearer": []}, {"HTTPBearer": []}]),
    }


def register_docs_routes(app: FastAPI):
    """Registers the interactive documentation endpoints and filtered OpenAPI schemas."""
    setup_custom_openapi(app)

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

        if category_clean == "schemas":
            schemas_html = get_schemas_explorer_html()
            if schemas_html:
                return HTMLResponse(content=schemas_html)

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
                "defaultModelsExpandDepth": -1,
                "defaultModelExpandDepth": -1,
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

    @app.get("/api/redoc", include_in_schema=False)
    @app.get("/api/redoc/{category}", include_in_schema=False)
    async def custom_redoc_html(category: str = "all"):
        category_clean = (category or "all").lower().strip()
        valid_ids = [c["id"] for c in CATEGORY_METADATA]
        if category_clean not in valid_ids:
            category_clean = "all"

        redoc_html = get_redoc_custom_html(category_clean)
        if redoc_html:
            return HTMLResponse(content=redoc_html)

        from fastapi.openapi.docs import get_redoc_html
        return get_redoc_html(
            openapi_url=f"/api/openapi/{category_clean}.json" if category_clean != "all" else "/api/openapi.json",
            title=f"Sonikoma - ReDoc Reference",
            redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@2.1.3/bundles/redoc.standalone.js",
            redoc_favicon_url="https://fastapi.tiangolo.com/img/favicon.png",
        )

    @app.get("/admin", include_in_schema=False)
    @app.get("/admin/dashboard", include_in_schema=False)
    async def redirect_admin_to_docs():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/api/docs/system")

    @app.get("/admin/jobs", include_in_schema=False)
    async def redirect_admin_jobs_to_docs():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/api/docs/jobs")

    @app.get("/ai-core/models", include_in_schema=False)
    async def redirect_ai_models_to_docs():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/api/docs/ai")

    @app.get("/tests", include_in_schema=False)
    @app.get("/api/tests", include_in_schema=False)
    @app.get("/testing", include_in_schema=False)
    @app.get("/test-portal", include_in_schema=False)
    @app.get("/api/docs/tests", include_in_schema=False)
    async def custom_test_portal_html():
        portal_html = get_test_portal_html()
        if portal_html:
            return HTMLResponse(content=portal_html)
        return HTMLResponse(content="<h1>Sonikoma Test Portal</h1><p>Run 'npm test' or 'npm run test:report' to view automated test reports.</p>")

