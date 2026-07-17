"""
backend/app/core/logging/filters.py
─────────────────────────────────────────────────────────────────────────────
Custom logging filters.
─────────────────────────────────────────────────────────────────────────────
"""

import logging


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health"]):
                return False
        except Exception:
            pass
        return True
