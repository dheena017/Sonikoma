"""
backend/app/api/middleware/rate_limit.py
─────────────────────────────────────────────────────────────────────────────
Sliding window rate limiting middleware.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse

from core.settings import RATE_LIMIT_RPM

logger = logging.getLogger("sonikoma.api.middleware.rate_limit")

# In-memory sliding window request log: client_ip -> list of timestamps
client_request_log = {}

class RateLimitingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
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
