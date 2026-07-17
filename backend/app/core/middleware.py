"""
backend/app/middleware.py
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

from startup import logger, API_VERSION
from config.ports import FRONTEND_PORT, BACKEND_PORT
from api.dependencies.auth import get_current_user

# ─────────────────────────────────────────────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    f"http://localhost:{FRONTEND_PORT}",
    f"http://localhost:{BACKEND_PORT}",
    f"http://127.0.0.1:{FRONTEND_PORT}",
    f"http://127.0.0.1:{BACKEND_PORT}",
    os.getenv("APP_URL", f"http://localhost:{FRONTEND_PORT}"),
]

# ─────────────────────────────────────────────────────────────────────────────
# AUTHORIZATION MIDDLEWARE (3-tier hierarchy)
# ─────────────────────────────────────────────────────────────────────────────

# Public routes (no Authorization header required)
PUBLIC_ROUTE_SET = {
    "/api/health",
    "/api/py/health",
    "/api/health/ffmpeg",
    "/api/py/health/ffmpeg",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/forgot-password",
    "/api/auth/google/login",
    "/api/auth/google/callback",
    "/api/auth/token",             # Swagger Authorize button
    "/api/proxy-image",
    "/api/proxy/image",
    "/api/docs",
    "/openapi.json",
    "/api/openapi.json",
}

PUBLIC_ROUTE_PREFIXES = (
    "/api/projects/public/",
    "/static/",        # Swagger UI local CSS/JS assets
    "/api/docs/",      # Swagger sub-paths (e.g. /api/docs/oauth2-redirect)
    "/api/image/cached/",
    "/api/merge-images/cached/",
    "/api/stitch-images/cached/",
    "/videos/",        # Generated videos serving
    "/media/",         # Local processed panel layers served via <img src="/media/...">
    "/media",          # Defensive: allow the exact mount path too
)

# Admin-only endpoints (require creator_role/admin)
ADMIN_ROUTE_PREFIXES = (
    "/api/auth/admin",             # Match without trailing slash to cover all subroutes cleanly
    "/api/metrics/purge-cache",
    "/api/py/metrics/purge-cache",
    "/api/metrics/flush-temp",
    "/api/py/metrics/flush-temp",
    "/api/metrics/emergency-stop",
    "/api/py/metrics/emergency-stop",
    "/api/system-logs",
    "/api/py/system-logs",
)

class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # 0) Always pass CORS preflight OPTIONS requests through — CORSMiddleware handles them.
        if request.method == "OPTIONS":
            return await call_next(request)

        # 1) Public bypass
        if path in PUBLIC_ROUTE_SET or any(path.startswith(p) for p in PUBLIC_ROUTE_PREFIXES):
            return await call_next(request)

        # Explicit allow: GET /api/proxy-image (public)
        if path.startswith("/api/proxy-image"):
            return await call_next(request)

        # 2) Auth guard for everything else
        try:
            user = await get_current_user(request)
        except Exception:
            return JSONResponse(
                status_code=401,
                content={"success": False, "detail": "Missing or invalid Authorization token"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 3) Admin role guard
        is_admin_route = False
        if any(path.startswith(p) for p in ADMIN_ROUTE_PREFIXES):
            # Special exception: GET/POST/stream on /api/system-logs is standard authenticated user, only DELETE is admin.
            if (path.startswith("/api/system-logs") or path.startswith("/api/py/system-logs")) and request.method != "DELETE":
                is_admin_route = False
            else:
                is_admin_route = True

        if is_admin_route:
            if user.get("creator_role") != "admin":
                return JSONResponse(
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
    if any(p in path for p in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health", "/api/docs", "/api/openapi.json"]):
        return await call_next(request)

    client_ip = request.client.host if request.client else "unknown"
    if client_ip in ("127.0.0.1", "localhost", "::1"):
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

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed_ms}ms"
    response.headers["X-API-Version"]  = API_VERSION

    # Avoid logging SSE/logs polling endpoint spam
    if not any(path in request.url.path for path in ["/system-logs", "/api/metrics", "/api/health"]):
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
    # 1. CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time", "X-API-Version"],
    )

    # 2. Authorization middleware
    app.add_middleware(AuthorizationMiddleware)

    # 3. Rate limiting middleware (BaseHTTPMiddleware)
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limiting_middleware)

    # 4. Request tracing & timing middleware (BaseHTTPMiddleware)
    app.add_middleware(BaseHTTPMiddleware, dispatch=add_process_time_header)
