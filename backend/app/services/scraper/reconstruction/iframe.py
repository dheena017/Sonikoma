"""
backend/app/services/scraper/reconstruction/iframe.py
─────────────────────────────────────────────────────────────────────────────
Recursive reader iframe inspection and content recovery.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Optional, Any
from urllib.parse import urljoin
from ..models import CandidateImage
from ..constants import UNWANTED_PATTERNS

logger = logging.getLogger("sonikoma.services.scraper.reconstruction.iframe")


class IframeInspector:
    """Discovers and inspects chapter reader iframes while ignoring advertisement frames."""

    AD_DOMAINS = [
        "doubleclick", "google", "googlesyndication", "facebook", "amazon-adsystem",
        "adsystem", "adnxs", "criteo", "rubiconproject", "pubmatic", "outbrain",
        "taboola", "disqus", "recaptcha"
    ]

    @classmethod
    def find_reader_iframes(cls, soup: Any, base_url: str) -> List[str]:
        """Filters all iframe elements in the soup and returns candidate reader URLs."""
        if not soup:
            return []

        candidates = []
        for iframe in soup.find_all("iframe", src=True):
            src = iframe.get("src", "").strip()
            if not src or src.startswith("javascript:") or src == "about:blank":
                continue

            lower_src = src.lower()
            if any(ad in lower_src for ad in cls.AD_DOMAINS):
                continue
            if any(unw in lower_src for unw in UNWANTED_PATTERNS):
                continue

            abs_url = urljoin(base_url, src)
            candidates.append(abs_url)

        return candidates
