"""
backend/common/utils/http.py
─────────────────────────────────────────────────────────────────────────────
HTTP request inspection, client IP resolution, and token parsing helpers.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Optional
from fastapi import Request


def get_client_ip(request: Optional[Request], default: str = "127.0.0.1") -> str:
    """
    Extracts the client IP address from a FastAPI Request object.
    Checks reverse-proxy forwarded headers (X-Forwarded-For, X-Real-IP) before
    falling back to direct client host or default.
    """
    if not request:
        return default

    # 1. Check X-Forwarded-For (first entry is real client)
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
        if parts:
            return parts[0]

    # 2. Check X-Real-IP
    real_ip = request.headers.get("x-real-ip")
    if real_ip and real_ip.strip():
        return real_ip.strip()

    # 3. Direct client connection host
    if request.client and request.client.host:
        return request.client.host

    return default


def extract_bearer_token(request: Optional[Request]) -> Optional[str]:
    """Extracts raw Bearer token from Authorization header if present."""
    if not request:
        return None
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None


def get_user_agent(request: Optional[Request], default: str = "Unknown") -> str:
    """Extracts User-Agent string from request headers."""
    if not request:
        return default
    return request.headers.get("user-agent", default)


__all__ = [
    "get_client_ip",
    "extract_bearer_token",
    "get_user_agent",
]
