"""
backend/app/core/middleware.py
─────────────────────────────────────────────────────────────────────────────
Sonikoma FastAPI Middleware Stack
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.logging import logger, set_current_request_id, set_current_user_id
from app.core.config import APP_URL, BACKEND_PORT, FRONTEND_PORT, NODE_ENV, API_VERSION
from app.api.dependencies.auth import get_current_user

# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = []
if NODE_ENV == "production":
    if APP_URL:
        ALLOWED_ORIGINS = [APP_URL.rstrip("/")]
else:
    ALLOWED_ORIGINS = [
        f"http://localhost:{FRONTEND_PORT}",
        f"http://localhost:{BACKEND_PORT}",
        f"http://127.0.0.1:{FRONTEND_PORT}",
        f"http://127.0.0.1:{BACKEND_PORT}",
    ]
    if APP_URL:
        app_url_clean = APP_URL.rstrip("/")
        if app_url_clean not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(app_url_clean)

# ─────────────────────────────────────────────────────────────────────────────
# AUTHORIZATION MIDDLEWARE (3-tier hierarchy)
# ─────────────────────────────────────────────────────────────────────────────

# Public routes (no Authorization header required)
PUBLIC_ROUTE_SET = {
    "/api/v1/health",
    "/api/v1/system/health",
    "/api/v1/status",
    "/api/v1/system/status",
    "/api/v1/health/ffmpeg",
    "/api/v1/system/health/ffmpeg",
    "/api/v1/metrics",
    "/api/v1/system/metrics",
    "/api/v1/system/logs",            # Diagnostic log polling (system terminal panel)
    "/api/v1/system/system-logs",     # Alias
    "/api/v1/auth/register",
    "/api/v1/auth/login",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/google/login",
    "/api/v1/auth/google/callback",
    "/api/v1/auth/google/session",
    "/api/v1/export/youtube/oauth/callback",
    "/api/v1/auth/token",             # Swagger Authorize button
    "/api/v1/ai/models/catalog",      # AI Model Catalog metadata
    "/api/v1/ai/models/routing",      # AI Task-to-Model Routing configuration
    "/api/v1/ai/list-models",
    "/api/v1/ai/analyze-image",
    "/api/v1/ai/analyze-all-panels",
    "/api/v1/ai/analyze-sequence",
    "/api/v1/ai/analyze-batch",
    "/api/v1/proxy/image",
    "/api/v1/scraper/reader-chapter",
    "/api/v1/scraper/chapter/sync",
    "/api/v1/scraper/series",
    "/api/v1/scraper/separate-url",
    "/api/v1/scraper/detect-platform",
    "/api/v1/docs",
    "/api/v1/redoc",
    "/api/v1/openapi.json",
    "/api/v1/tests",
    "/api/v1/docs/tests",
}

PUBLIC_ROUTE_PREFIXES = (
    "/api/v1/openapi/",   # Category-filtered OpenAPI JSONs (/api/v1/openapi/projects.json, etc.)
    "/api/v1/projects/public/",
    "/api/v1/projects/transfer",
    "/static/",        # Swagger UI local CSS/JS assets
    "/api/v1/docs/",
    "/api/v1/images/",
    "/api/v1/images/cached/",
    "/api/v1/proxy/",
    "/videos/",        # Generated videos serving
    "/media/",         # Local processed panel layers served via <img src="/media/...">
    "/media",          # Defensive: allow the exact mount path too
    "/playwright-report", # Playwright Interactive Visual Report assets & pages
    "/playwright-report/",
    "/api/v1/export/youtube/", # YouTube publisher routes (uses get_optional_current_user in router)
    "/api/v1/system/logs/",   # SSE real-time log stream (/api/v1/system/logs/stream)
    "/api/v1/scraper/",
    "/api/v1/audio/",
    "/api/v1/ocr/",
    "/api/v1/panels/",
    "/api/v1/video/",
    "/api/v1/jobs/",
    "/api/v1/ai/",
)

# Admin-only endpoints (require creator_role/admin)
ADMIN_ROUTE_PREFIXES = (
    "/api/v1/auth/admin",             # Match without trailing slash to cover all subroutes cleanly
    "/api/v1/system/metrics/purge-cache",
    "/api/v1/metrics/purge-cache",
    "/api/v1/system/metrics/flush-temp",
    "/api/v1/metrics/flush-temp",
    "/api/v1/system/metrics/emergency-stop",
    "/api/v1/metrics/emergency-stop",
    "/api/v1/system/logs",
    "/api/v1/system/system-logs",
)

class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 0) Always pass CORS preflight OPTIONS requests through — CORSMiddleware handles them.
        if request.method == "OPTIONS":
            return await call_next(request)

        # 1) Public bypass: any non-api route, public route, or static asset
        if not path.startswith("/api") or path in PUBLIC_ROUTE_SET or any(path.startswith(p) for p in PUBLIC_ROUTE_PREFIXES):
            return await call_next(request)

        # 2) Auth guard for everything else
        try:
            user = await get_current_user(request)
        except Exception:
            from app.core.responses import PrettyJSONResponse
            return PrettyJSONResponse(
                status_code=401,
                content={"success": False, "detail": "Missing or invalid Authorization token"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3) Admin role guard
        is_admin_route = False
        if any(path.startswith(p) for p in ADMIN_ROUTE_PREFIXES):
            # Special exception: GET/POST/stream on /api/v1/system/logs is standard authenticated user, only DELETE is admin.
            if (path.startswith("/api/v1/system/logs") or path.startswith("/api/v1/system/system-logs")) and request.method != "DELETE":
                is_admin_route = False
            else:
                is_admin_route = True

        if is_admin_route:
            if user.get("creator_role") != "admin":
                from app.core.responses import PrettyJSONResponse
                return PrettyJSONResponse(
                    status_code=403,
                    content={"success": False, "detail": "Administrative privileges required."},
                )

        # attach for downstream handlers that may want it later
        request.state.user = user
        return await call_next(request)

# ─────────────────────────────────────────────────────────────────────────────
# RATE LIMITING
# ─────────────────────────────────────────────────────────────────────────────
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "120"))
client_request_log = {}

async def rate_limiting_middleware(request: Request, call_next):
    # Bypass metrics, health, docs, openapi, and logs to prevent lockout or UI terminal interruption
    path = request.url.path
    if any(p in path for p in ["/api/v1/system/logs", "/system-logs", "/api/v1/system/metrics", "/api/v1/system/health", "/api/v1/system/status", "/metrics", "/health", "/api/v1/docs", "/api/v1/openapi.json"]):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    if client_ip in ("127.0.0.1", "localhost", "::1", "testclient") or os.getenv("TESTING") == "1":
        return await call_next(request)

    now = time.time()

    # Clean old requests and get the log
    timestamps = client_request_log.get(client_ip, [])
    timestamps = [t for t in timestamps if now - t < 60]

    if len(timestamps) >= RATE_LIMIT_RPM:
        retry_after = int(60 - (now - timestamps[0]))
        retry_after = max(1, retry_after)

        logger.warning(
            f"[API] Rate Limit Exceeded | Client: {client_ip} | "
            f"Requests in window: {len(timestamps)} | Limit: {RATE_LIMIT_RPM} RPM | "
            f"Retry-After: {retry_after}s"
        )
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": "Too Many Requests",
                "message": f"Rate limit of {RATE_LIMIT_RPM} requests per minute exceeded. Please try again in {retry_after} seconds.",
            },
            headers={"Retry-After": str(retry_after)}
        )

    timestamps.append(now)
    client_request_log[client_ip] = timestamps

    # Occasional cleanup to prevent memory leaks if many unique IPs connect
    if len(client_request_log) > 1000:
        expired_ips = []
        for ip, ts_list in list(client_request_log.items()):
            purged = [t for t in ts_list if now - t < 60]
            if not purged:
                expired_ips.append(ip)
            else:
                client_request_log[ip] = purged
        for ip in expired_ips:
            client_request_log.pop(ip, None)

    return await call_next(request)

# ─────────────────────────────────────────────────────────────────────────────
# ADD PROCESS TIME HEADER & REQUEST LOGGING
# ─────────────────────────────────────────────────────────────────────────────
async def add_process_time_header(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
    set_current_request_id(request_id)

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed_ms}ms"
    response.headers["X-API-Version"]  = API_VERSION

    # Avoid logging high-frequency image proxy/cached & SSE polling endpoint spam
    if not any(p in request.url.path for p in ["/system/logs", "/system/metrics", "/system/health", "/health", "/metrics", "/credits", "/proxy/image", "/images/cached"]):
        method_colors = {
            "GET": "\x1b[32m",
            "POST": "\x1b[33m",
            "PUT": "\x1b[34m",
            "DELETE": "\x1b[31m"
        }
        m_color = method_colors.get(request.method, "\x1b[37m")

        status = response.status_code
        if status >= 500:
            s_color = "\x1b[31m"
        elif status >= 400:
            s_color = "\x1b[33m"
        elif status >= 300:
            s_color = "\x1b[36m"
        else:
            s_color = "\x1b[32m"

        reset = "\x1b[0m"
        grey = "\x1b[90m"
        cyan = "\x1b[36m"

        logger.info(
            f"{grey}[{request_id}]{reset} "
            f"{m_color}{request.method}{reset} "
            f"{cyan}{request.url.path}{reset} -> "
            f"{s_color}{status}{reset} "
            f"{grey}({elapsed_ms}ms){reset}"
        )
    return response

# ─────────────────────────────────────────────────────────────────────────────
# MIDDLEWARE SETUP WIRING
# ─────────────────────────────────────────────────────────────────────────────
def setup_middleware(app: FastAPI):
    # 1. Request tracing & timing middleware (BaseHTTPMiddleware)
    app.add_middleware(BaseHTTPMiddleware, dispatch=add_process_time_header)

    # 2. Rate limiting middleware (BaseHTTPMiddleware)
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limiting_middleware)

    # 3. Authorization middleware
    app.add_middleware(AuthorizationMiddleware)

    # 4. CORS middleware (Added last so it wraps the entire middleware stack and ensures CORS headers on all responses)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"^chrome-extension://.*$|^http://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time", "X-API-Version"],
    )
