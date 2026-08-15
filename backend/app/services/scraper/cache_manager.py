"""
backend/app/services/scraper/cache_manager.py
─────────────────────────────────────────────────────────────────────────────
Versioned Cache Manager for the Adaptive Scraper.
Uses SCRAPER_VERSION + canonical_url + chapter_identity.
Ensures live scrapes are authoritative while performing incremental
new-image detection against previously cached results.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import hashlib
import logging
from typing import List, Dict, Any, Optional, Set
from .models import ImageItem, ChapterResult
from .constants import SCRAPER_VERSION

try:
    from repositories.scraper import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

try:
    from repositories.episode_cache import check_sqlite_cache, save_sqlite_cache
except ImportError:
    check_sqlite_cache = None
    save_sqlite_cache = None

logger = logging.getLogger("sonikoma.services.scraper.cache")


class ScraperCacheManager:
    """Manages versioned scraper caching and incremental image change detection."""

    @classmethod
    def generate_fingerprint(cls, url: str) -> str:
        """Generates a consistent hash fingerprint for an image URL."""
        clean = url.split("?")[0] if url.startswith(("http://", "https://")) else url
        return hashlib.md5(clean.encode("utf-8")).hexdigest()[:16]

    @classmethod
    def build_cache_key(cls, canonical_url: str, chapter_id: Optional[str] = None) -> str:
        """Constructs a cache key combining canonical URL, chapter identity, and scraper version."""
        ch = chapter_id or "default"
        raw = f"{canonical_url}|{ch}|v{SCRAPER_VERSION}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    def detect_new_images(
        cls,
        canonical_url: str,
        current_images: List[ImageItem],
        chapter_id: Optional[str] = None
    ) -> List[ImageItem]:
        """
        Compares current live image items against the previous session cache.
        Marks newly discovered images with is_new=True and populates image fingerprints.
        """
        for img in current_images:
            img.fingerprint = cls.generate_fingerprint(img.url)

        previous_session = None
        if get_latest_scrape_session:
            try:
                previous_session = get_latest_scrape_session(canonical_url)
            except Exception as e:
                logger.debug(f"[ScraperCacheManager] Session check warning: {e}")

        if not previous_session:
            # First scrape: all images are existing/baseline (not marked as new increment)
            for img in current_images:
                img.is_new = False
            return current_images

        # Extract previous URL fingerprints
        prev_urls = previous_session.get("image_urls") or []
        prev_fingerprints: Set[str] = {cls.generate_fingerprint(u) for u in prev_urls}

        # Any image whose fingerprint was not present in the previous session is marked is_new=True
        for img in current_images:
            if img.fingerprint and img.fingerprint not in prev_fingerprints:
                img.is_new = True
            else:
                img.is_new = False

        return current_images

    @classmethod
    def save_result(cls, canonical_url: str, images: List[ImageItem]) -> None:
        """Persists the authoritative live scrape result to cache."""
        if not images:
            return

        urls = [img.url for img in images]
        if save_scrape_session:
            try:
                save_scrape_session(canonical_url, urls)
            except Exception as e:
                logger.debug(f"[ScraperCacheManager] Save scrape session warning: {e}")

        if save_sqlite_cache:
            try:
                save_sqlite_cache(canonical_url, urls)
            except Exception as e:
                logger.debug(f"[ScraperCacheManager] SQLite cache save warning: {e}")
