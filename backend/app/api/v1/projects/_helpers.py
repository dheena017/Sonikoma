"""
api/v1/projects/_helpers.py
─────────────────────────────────────────────────────────────────────────────
Shared utilities used across all project sub-modules.
─────────────────────────────────────────────────────────────────────────────
"""

from database.connection import unwrap_proxy_url


def wrap_proxy_url(url_str: str) -> str:
    """Ensure external image URLs are routed through the backend proxy."""
    cleaned = unwrap_proxy_url(url_str)
    if not cleaned:
        return ""
    if cleaned.startswith("http") and "/api/" not in cleaned:
        from urllib.parse import quote
        return f"/api/proxy-image?url={quote(cleaned)}"
    return cleaned
