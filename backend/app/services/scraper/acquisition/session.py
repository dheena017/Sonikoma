"""
backend/app/services/scraper/acquisition/session.py
─────────────────────────────────────────────────────────────────────────────
Session, Cookie Jar, and Header management for the scraper.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Optional, Any
from urllib.parse import urlparse
import random
from ..constants import USER_AGENTS


class SessionManager:
    """Manages cookies, custom headers, and request configuration."""

    DEFAULT_COOKIES = {
        "needZoneZone": "true",
        "locale": "en",
        "cc": "US",
        "ageGatePass": "true",
        "adult": "true"
    }

    @classmethod
    def build_headers(
        cls,
        url: str,
        custom_headers: Optional[Dict[str, str]] = None,
        referer: Optional[str] = None
    ) -> Dict[str, str]:
        """Constructs headers with automatic referer and random user agent."""
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.netloc else "https://www.webtoons.com"
        ref = referer or f"{origin}/"

        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Referer": ref,
            "Origin": origin,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
        }

        if custom_headers:
            headers.update(custom_headers)

        return headers

    @classmethod
    def build_cookies(cls, custom_cookies: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Constructs default bypass cookies merged with custom cookies."""
        cookies = dict(cls.DEFAULT_COOKIES)
        if custom_cookies:
            cookies.update(custom_cookies)
        return cookies

    @classmethod
    def format_cookie_header(cls, cookies: Dict[str, str]) -> str:
        """Formats a dictionary of cookies into a standard Cookie header string."""
        return "; ".join(f"{k}={v}" for k, v in cookies.items())
