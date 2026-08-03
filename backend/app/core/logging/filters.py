"""
backend/app/core/logging/filters.py
─────────────────────────────────────────────────────────────────────────────
Custom logging filters.
─────────────────────────────────────────────────────────────────────────────
"""

import logging


class EndpointFilter(logging.Filter):
    NOISY_PATHS = (
        "/system-logs",
        "/api/system-logs",
        "/api/v1/system-logs",
        "/system-logs/stream",
        "/api/metrics",
        "/metrics",
        "/api/health",
        "/api/v1/health",
        "/health",
        "/healthz",
        "/api/status",
        "/api/v1/status",
        "/status",
        "/api/auth/credits",
        "auth/credits",
        "/api/proxy-image",
        "/proxy-image",
        "/api/proxy/image",
        "/proxy/image",
        "/api/image/cached",
        "/image/cached",
        "/favicon.ico",
        "OPTIONS /",
    )

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in self.NOISY_PATHS):
                return False
        except Exception:
            pass
        return True
