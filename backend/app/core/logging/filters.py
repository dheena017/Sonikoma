"""
backend/app/core/logging/filters.py
─────────────────────────────────────────────────────────────────────────────
High-performance logging filter with smart error pass-through,
high-frequency route suppression, and environment-configurable silencing.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import logging
from typing import Set, Tuple


class EndpointFilter(logging.Filter):
    """
    Intelligently filters out noisy high-frequency HTTP access logs
    while guaranteeing that errors (4xx / 5xx) always pass through.
    """

    # Base set of high-frequency polling, health checks, and static asset routes
    DEFAULT_SILENCED_PREFIXES: Tuple[str, ...] = (
        "/system/logs",
        "/api/system/logs",
        "/api/v1/system/logs",
        "/system/metrics",
        "/api/system/metrics",
        "/api/v1/system/metrics",
        "/system/health",
        "/api/system/health",
        "/api/v1/system/health",
        "/system-logs",
        "/api/system-logs",
        "/api/v1/system-logs",
        "/health",
        "/healthz",
        "/api/health",
        "/api/v1/health",
        "/metrics",
        "/api/metrics",
        "/status",
        "/api/status",
        "/api/v1/status",
        "/api/auth/credits",
        "/api/v1/auth/credits",
        "/api/proxy-image",
        "/proxy-image",
        "/api/proxy/image",
        "/proxy/image",
        "/api/image/cached",
        "/image/cached",
        "/favicon.ico",
        "/@vite",
        "/__vite",
        "/node_modules",
    )

    def __init__(self, name: str = ""):
        super().__init__(name)
        # Load extra custom endpoints from env if provided (comma-separated)
        extra_env = os.getenv("SILENCED_LOG_ROUTES", "")
        extra_routes = [r.strip() for r in extra_env.split(",") if r.strip()]
        self.silenced_prefixes = tuple(list(self.DEFAULT_SILENCED_PREFIXES) + extra_routes)

    def _extract_status_code(self, record: logging.LogRecord, msg: str) -> int:
        """Attempts to extract HTTP status code from uvicorn log record."""
        # 1. Check uvicorn access record args: (client_ip, method, path, http_ver, status_code)
        if record.args and len(record.args) >= 5:
            try:
                return int(record.args[4])
            except (ValueError, TypeError):
                pass
        elif record.args and len(record.args) >= 1:
            try:
                # If last argument is status code integer
                if isinstance(record.args[-1], int):
                    return record.args[-1]
            except Exception:
                pass

        # 2. Extract HTTP status via regex (e.g. '" 200', ' 200 OK', ' 500 Internal', ' 500')
        match = re.search(r'(?:\"|\s)\s*([1-5]\d\d)(?:\s+|$)', msg)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return 200

    def _is_silenced_path(self, target: str) -> bool:
        """Checks if a target URL path matches any silenced prefix."""
        if not target:
            return False
        # Strip query strings and hashes for clean path checking
        clean_path = target.split("?")[0].split("#")[0].strip()
        for prefix in self.silenced_prefixes:
            if prefix in clean_path or clean_path.startswith(prefix):
                return True
        return False

    def filter(self, record: logging.LogRecord) -> bool:
        try:
            # Always allow ERROR, CRITICAL, and WARNING logs through unconditionally
            if record.levelno >= logging.WARNING:
                return True

            msg = record.getMessage()

            # Pass through if the request resulted in a 4xx / 5xx error
            status_code = self._extract_status_code(record, msg)
            if status_code >= 400:
                return True

            # Always pass through mutations (POST, PUT, DELETE, PATCH) so project/upload actions are visible
            if any(verb in msg for verb in ("POST ", "PUT ", "DELETE ", "PATCH ")):
                return True

            # Check OPTIONS pre-flight noise
            if "OPTIONS /" in msg or (isinstance(record.msg, str) and "OPTIONS /" in record.msg):
                return False

            # Check raw msg
            if isinstance(record.msg, str) and self._is_silenced_path(record.msg):
                return False

            # Check formatted message
            if self._is_silenced_path(msg):
                return False

            # Check tuple args (specifically uvicorn.access path and raw url strings)
            if record.args:
                for arg in record.args:
                    if isinstance(arg, str) and self._is_silenced_path(arg):
                        return False

        except Exception:
            # Fail open: if filter logic throws, never drop a log message
            return True

        return True
