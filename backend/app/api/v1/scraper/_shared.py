"""
backend/app/api/v1/scraper/_shared.py
─────────────────────────────────────────────────────────────────────────────
Shared helpers, common imports, and utilities used across all scraper
sub-modules. Centralises dependency imports so each sub-module stays clean.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Dict
from urllib.parse import urlparse, quote

from fastapi import HTTPException

from services.scraper.domain_rate_limiter import domain_block_manager

logger = logging.getLogger("sonikoma.api.scraper")


def parse_cookie_string(raw: Optional[str]) -> Optional[Dict[str, str]]:
    """Parse a standard HTTP cookie header string into a key-value dictionary."""
    if not raw:
        return None
    cookies = {}
    for chunk in raw.split(";"):
        chunk = chunk.strip()
        if not chunk or "=" not in chunk:
            continue
        name, value = chunk.split("=", 1)
        name = name.strip()
        value = value.strip().strip('"')
        if name:
            cookies[name] = value
    return cookies if cookies else None


def assert_not_blocked(url: str) -> None:
    """Raise 403 HTTPException if the target URL's domain is blocked."""
    if domain_block_manager.is_blocked(url):
        domain = urlparse(url).netloc or url
        logger.warning(f"[ScraperAPI] Blocked domain rejected: {domain}")
        raise HTTPException(
            status_code=403,
            detail=f"This domain ({domain}) is currently in the blocked exclusion list."
        )
