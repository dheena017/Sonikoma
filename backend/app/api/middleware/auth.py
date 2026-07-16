"""
backend/app/api/middleware/auth.py
─────────────────────────────────────────────────────────────────────────────
Authorization and route protection middleware. Centralizes public bypass and
admin privilege checks.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

from api.dependencies.auth import get_current_user

logger = logging.getLogger("sonikoma.api.middleware.auth")

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
