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
    from database.engine import get_db_connection
except ImportError:
    try:
        from app.database.engine import get_db_connection
    except ImportError:
        get_db_connection = None

try:
    from repositories.scraper import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

logger = logging.getLogger("sonikoma.services.scraper.cache")


class ScraperCacheManager:
    """Manages multi-tier L1-L5 caching and idempotency verification with SQLite persistence."""

    _initialized = False
    _L1_HTML_TTL: float = 900.0   # 15 minutes
    _L5_RESULT_TTL: float = 3600.0  # 1 hour

    # In-memory fast fallbacks
    _mem_l1: Dict[str, Tuple[str, float]] = {}
    _mem_l5: Dict[str, Tuple[Dict[str, Any], float]] = {}

    @classmethod
    def _ensure_tables(cls):
        if cls._initialized or not get_db_connection:
            return
        try:
            with get_db_connection() as conn:
                conn.execute("""
                CREATE TABLE IF NOT EXISTS scraper_l1_cache (
                    cache_key   TEXT PRIMARY KEY,
                    url         TEXT NOT NULL,
                    html        TEXT NOT NULL,
                    expires_at  REAL NOT NULL,
                    created_at  TEXT DEFAULT (datetime('now'))
                )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_scraper_l1_exp ON scraper_l1_cache(expires_at)")

                conn.execute("""
                CREATE TABLE IF NOT EXISTS scraper_l5_cache (
                    idempotency_key TEXT PRIMARY KEY,
                    canonical_url   TEXT NOT NULL,
                    result_json     TEXT NOT NULL,
                    expires_at      REAL NOT NULL,
                    created_at      TEXT DEFAULT (datetime('now'))
                )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_scraper_l5_exp ON scraper_l5_cache(expires_at)")
                conn.commit()
                cls._initialized = True
        except Exception as e:
            logger.debug(f"[ScraperCacheManager] DB init notice: {e}")

    @classmethod
    def generate_fingerprint(cls, url: str) -> str:
        clean = url.split("?")[0] if url.startswith(("http://", "https://")) else url
        return hashlib.md5(clean.encode("utf-8")).hexdigest()[:16]

    @classmethod
    def build_idempotency_key(cls, canonical_url: str, project_id: Optional[str] = None) -> str:
        raw = f"{canonical_url.strip().lower()}|{project_id or 'default'}|v{SCRAPER_VERSION}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    # ── L1: HTML Request Cache ───────────────────────────────────────────────
    @classmethod
    def get_l1_html(cls, url: str) -> Optional[str]:
        k = hashlib.md5(url.strip().lower().encode("utf-8")).hexdigest()
        now = time.time()

        # Try DB
        if get_db_connection:
            cls._ensure_tables()
            try:
                with get_db_connection() as conn:
                    row = conn.execute(
                        "SELECT html FROM scraper_l1_cache WHERE cache_key = ? AND expires_at > ?",
                        (k, now)
                    ).fetchone()
                    if row and row["html"]:
                        return row["html"]
            except Exception:
                pass

        # Memory fallback
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

        # Memory store
        cls._mem_l1[k] = (html, expires)

        # SQLite store
        if get_db_connection:
            cls._ensure_tables()
            try:
                with get_db_connection() as conn:
                    conn.execute("""
                    INSERT INTO scraper_l1_cache (cache_key, url, html, expires_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(cache_key) DO UPDATE SET
                        html = excluded.html,
                        expires_at = excluded.expires_at
                    """, (k, url, html, expires))
                    conn.commit()
            except Exception:
                pass

    # ── L5: Result & Idempotency Cache ───────────────────────────────────────
    @classmethod
    def get_cached_chapter_result(cls, canonical_url: str, bypass_cache: bool = False) -> Optional[ChapterResult]:
        if bypass_cache:
            return None
        k = cls.build_idempotency_key(canonical_url)
        now = time.time()

        # Try SQLite
        if get_db_connection:
            cls._ensure_tables()
            try:
                with get_db_connection() as conn:
                    row = conn.execute(
                        "SELECT result_json FROM scraper_l5_cache WHERE idempotency_key = ? AND expires_at > ?",
                        (k, now)
                    ).fetchone()
                    if row and row["result_json"]:
                        res_dict = json.loads(row["result_json"])
                        logger.info(f"[ScraperCacheManager] L5 Idempotency Cache HIT (SQLite) for {canonical_url}")
                        return ChapterResult(**res_dict)
            except Exception as e:
                logger.debug(f"[ScraperCacheManager] L5 DB read error: {e}")

        # Memory fallback
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
        res_json = json.dumps(result.model_dump())

        # Memory store
        cls._mem_l5[k] = (result.model_dump(), expires)

        # SQLite store
        if get_db_connection:
            cls._ensure_tables()
            try:
                with get_db_connection() as conn:
                    conn.execute("""
                    INSERT INTO scraper_l5_cache (idempotency_key, canonical_url, result_json, expires_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(idempotency_key) DO UPDATE SET
                        result_json = excluded.result_json,
                        expires_at = excluded.expires_at
                    """, (k, canonical_url, res_json, expires))
                    conn.commit()
            except Exception as e:
                logger.debug(f"[ScraperCacheManager] L5 DB write error: {e}")

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
                logger.debug(f"[ScraperCacheManager] Session check warning: {e}")

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
                logger.debug(f"[ScraperCacheManager] Save scrape session warning: {e}")

    # ── In-Memory Fast Cache Clearing & Session Operations ──────────────────
    @classmethod
    def clear(cls) -> Dict[str, Any]:
        """Flushes in-memory RAM caches (_mem_l1, _mem_l5) and SQLite persistent cache tables."""
        l1_count = len(cls._mem_l1)
        l5_count = len(cls._mem_l5)
        cls._mem_l1.clear()
        cls._mem_l5.clear()

        if get_db_connection:
            try:
                with get_db_connection() as conn:
                    conn.execute("DELETE FROM scraper_l1_cache")
                    conn.execute("DELETE FROM scraper_l5_cache")
                    conn.commit()
            except Exception:
                pass

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

