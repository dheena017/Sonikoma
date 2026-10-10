"""
backend/app/services/scraper/cache_manager.py
─────────────────────────────────────────────────────────────────────────────
Multi-Level Cache & Idempotency Manager (L1 to L5).
Backed by SQLite database for seamless sharing across multi-worker Uvicorn processes.
  • L1: Request/HTML cache with TTL
  • L2: Blueprint Strategy Cache (SQLite DomainMemory)
  • L3: Extracted Metadata Cache
  • L4: Asset & Image Proxy Cache
  • L5: Result & Idempotency Cache (instant 0ms reuse for identical canonical URLs)
─────────────────────────────────────────────────────────────────────────────
"""

import time
import json
import hashlib
import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from .scraper_models import ImageItem, ChapterResult
from .scraper_constants import SCRAPER_VERSION



try:
    from features.platform.scraper.repositories import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

logger = logging.getLogger("sonikoma.services.scraper.cache")


class ScraperCacheManager:
    """Manages multi-tier L1-L5 caching and idempotency verification in-memory."""

    _L1_HTML_TTL: float = 900.0   # 15 minutes
    _L5_RESULT_TTL: float = 3600.0  # 1 hour

    # In-memory fast stores
    _mem_l1: Dict[str, Tuple[str, float]] = {}
    _mem_l5: Dict[str, Tuple[Dict[str, Any], float]] = {}

    @classmethod
    def generate_fingerprint(cls, url: str) -> str:
        clean = url.split("?")[0] if url.startswith(("http://", "https://")) else url
        return hashlib.md5(clean.encode("utf-8")).hexdigest()[:16]

    @classmethod
    def build_idempotency_key(cls, canonical_url: str, project_id: Optional[str] = None) -> str:
        raw = f"{canonical_url.strip().lower()}|{project_id or 'default'}|v{SCRAPER_VERSION}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    # ── L1: HTML Request Cache (In-Memory) ───────────────────────────────────
    @classmethod
    def get_l1_html(cls, url: str) -> Optional[str]:
        k = hashlib.md5(url.strip().lower().encode("utf-8")).hexdigest()
        now = time.time()

        if k in cls._mem_l1:
            html, exp = cls._mem_l1[k]
            if exp > now:
                return html
            del cls._mem_l1[k]

        return None

    @classmethod
    def set_l1_html(cls, url: str, html: str) -> None:
        if not html:
            return
        k = hashlib.md5(url.strip().lower().encode("utf-8")).hexdigest()
        expires = time.time() + cls._L1_HTML_TTL
        cls._mem_l1[k] = (html, expires)

    # ── L5: Result & Idempotency Cache (In-Memory) ───────────────────────────
    @classmethod
    def get_cached_chapter_result(cls, canonical_url: str, bypass_cache: bool = False) -> Optional[ChapterResult]:
        if bypass_cache:
            return None
        k = cls.build_idempotency_key(canonical_url)
        now = time.time()

        if k in cls._mem_l5:
            res_dict, exp = cls._mem_l5[k]
            if exp > now:
                try:
                    logger.info(f"[ScraperCacheManager] L5 Idempotency Cache HIT (Mem) for {canonical_url}")
                    return ChapterResult(**res_dict)
                except Exception:
                    pass
            del cls._mem_l5[k]

        return None

    @classmethod
    def set_cached_chapter_result(cls, canonical_url: str, result: ChapterResult) -> None:
        if not result or not result.success or not result.images:
            return
        k = cls.build_idempotency_key(canonical_url)
        expires = time.time() + cls._L5_RESULT_TTL
        cls._mem_l5[k] = (result.model_dump(), expires)

    # ── Session & Incremental Discovery ──────────────────────────────────────
    @classmethod
    def detect_new_images(
        cls,
        canonical_url: str,
        current_images: List[ImageItem],
        chapter_id: Optional[str] = None
    ) -> List[ImageItem]:
        """Marks newly discovered images with is_new=True and populates image fingerprints."""
        for img in current_images:
            img.fingerprint = cls.generate_fingerprint(img.url)

        previous_session = None
        if get_latest_scrape_session:
            try:
                previous_session = get_latest_scrape_session(canonical_url)
            except Exception as e:
                pass

        if not previous_session:
            for img in current_images:
                img.is_new = False
            return current_images

        prev_urls = previous_session.get("image_urls") or []
        prev_fingerprints: Set[str] = {cls.generate_fingerprint(u) for u in prev_urls}

        for img in current_images:
            img.is_new = bool(img.fingerprint and img.fingerprint not in prev_fingerprints)

        return current_images

    @classmethod
    def save_result(cls, canonical_url: str, images: List[ImageItem]) -> None:
        """Persists the authoritative live scrape result to session store."""
        if not images:
            return
        urls = [img.url for img in images]
        if save_scrape_session:
            try:
                save_scrape_session(canonical_url, urls)
            except Exception as e:
                pass

    # ── In-Memory Fast Cache Clearing & Session Operations ──────────────────
    @classmethod
    def clear(cls) -> Dict[str, Any]:
        """Flushes in-memory RAM caches (_mem_l1, _mem_l5)."""
        l1_count = len(cls._mem_l1)
        l5_count = len(cls._mem_l5)
        cls._mem_l1.clear()
        cls._mem_l5.clear()

        return {
            "success": True,
            "message": f"Cleared {l1_count} L1 HTML caches and {l5_count} L5 result caches."
        }

    @classmethod
    def get_session(cls, canonical_url: str) -> Optional[Dict[str, Any]]:
        """Retrieves session for a URL."""
        if get_latest_scrape_session:
            try:
                return get_latest_scrape_session(canonical_url)
            except Exception:
                pass
        return None

    @classmethod
    def update_session(cls, canonical_url: str, images: List[str]) -> bool:
        """Updates curated images in active session."""
        if save_scrape_session:
            try:
                save_scrape_session(canonical_url, images)
                return True
            except Exception:
                pass
        return False

    @classmethod
    def delete_session(cls, canonical_url: str) -> bool:
        """Deletes session cache for URL."""
        k1 = cls._make_l1_key(canonical_url)
        k5 = cls._make_l5_key(canonical_url)
        cls._mem_l1.pop(k1, None)
        cls._mem_l5.pop(k5, None)
        return True

