"""
backend/app/api/middleware/logging.py
─────────────────────────────────────────────────────────────────────────────
Request tracking, correlation ID, timing headers, and console print middleware.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("sonikoma.api.middleware.logging")

API_VERSION = "1.0.0"

class ProcessTimeLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Tracing/Correlation Request ID
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
