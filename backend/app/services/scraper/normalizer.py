"""
backend/app/services/scraper/normalizer.py
─────────────────────────────────────────────────────────────────────────────
URL Normalization, Canonicalization, and Site/Platform Analysis.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode
from typing import Optional, Dict, Any, Tuple
from .models import SourceInfo


class UrlNormalizer:
    """Normalizes and canonicalizes input URLs for scraper consumption."""

    TRACKING_PARAMS = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "_ga", "_gl", "ref", "source", "spm"
    }

    @classmethod
    def extract_first_url(cls, raw_input: str) -> str:
        """Extracts the first valid URL if multiple links or strings were pasted together."""
        if not raw_input:
            return ""
        trimmed = raw_input.strip()
        m = re.search(r'https?://[^\s"\']+', trimmed, re.IGNORECASE)
        return m.group(0) if m else trimmed

    @classmethod
    def normalize_url(cls, raw_url: str) -> str:
        """Strips tracking params, cleans whitespace, and normalizes structure."""
        url = cls.extract_first_url(raw_url)
        if not url:
            return ""

        if not url.startswith(("http://", "https://", "file://", "data:image/")):
            # If scheme is missing, assume https://
            if "." in url and not url.startswith("/"):
                url = "https://" + url

        try:
            parsed = urlparse(url)
            if not parsed.scheme or not parsed.netloc:
                return url

            # Filter out tracking query params
            query_dict = parse_qs(parsed.query, keep_blank_values=True)
            clean_query_dict = {
                k: v for k, v in query_dict.items()
                if k.lower() not in cls.TRACKING_PARAMS
            }

            clean_query = urlencode(clean_query_dict, doseq=True)
            # Remove trailing slash from path if path is not just '/'
            clean_path = parsed.path
            if len(clean_path) > 1 and clean_path.endswith("/"):
                clean_path = clean_path[:-1]

            canonical = urlunparse((
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                clean_path,
                parsed.params,
                clean_query,
                ""  # Strip fragment
            ))
            return canonical
        except Exception:
            return url


class SiteAnalyzer:
    """Analyzes a URL to extract domain, platform signatures, and page classification."""

    PLATFORM_SIGNATURES = {
        "webtoons.com": "webtoons",
        "webtoon.com": "webtoons",
        "naver.com": "naver_webtoon",
        "tapas.io": "tapas",
        "tappytoon.com": "tappytoon",
        "manta.net": "manta",
        "mangadex.org": "mangadex",
        "webcomicsapp.com": "webcomicsapp",
        "lezhin.com": "lezhin",
        "bilibilicomics.com": "bilibili"
    }

    CHAPTER_PATH_INDICATORS = {
        "episode", "episodes", "chapter", "chapters", "viewer",
        "read", "ch-", "ep-", "c-", "chap"
    }

    SERIES_PATH_INDICATORS = {
        "series", "comic", "title", "manga", "manhwa", "detail", "list"
    }

    @classmethod
    def analyze(cls, raw_url: str) -> SourceInfo:
        """Performs full site analysis on the provided URL."""
        canonical_url = UrlNormalizer.normalize_url(raw_url)
        parsed = urlparse(canonical_url)
        domain = parsed.netloc.lower()

        # Match known platform
        platform = "generic"
        for domain_key, plat_name in cls.PLATFORM_SIGNATURES.items():
            if domain_key in domain:
                platform = plat_name
                break

        # Check if URL looks like a chapter or series page
        path_lower = parsed.path.lower()
        query_dict = parse_qs(parsed.query)

        is_chapter = False
        # Webtoon query parameter check (e.g. episode_no=1 or title_no=123 with viewer in path)
        if "episode_no" in query_dict or "chapter_no" in query_dict:
            is_chapter = True
        elif any(f"/{ind}/" in path_lower or path_lower.endswith(f"/{ind}") or f"-{ind}-" in path_lower for ind in cls.CHAPTER_PATH_INDICATORS):
            is_chapter = True
        elif re.search(r'/(?:ep|ch|chap|chapter|episode)[-_]?\d+', path_lower):
            is_chapter = True
        elif "viewer" in path_lower:
            is_chapter = True

        # Auth requirement hints
        requires_auth = False
        if any(term in path_lower for term in ["locked", "coin", "premium", "paywall"]):
            requires_auth = True

        return SourceInfo(
            original_url=raw_url,
            canonical_url=canonical_url,
            domain=domain,
            platform=platform,
            is_chapter_url=is_chapter,
            requires_auth=requires_auth
        )
