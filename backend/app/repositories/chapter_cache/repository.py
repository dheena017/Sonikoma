"""
backend/app/repositories/chapter_cache/repository.py
─────────────────────────────────────────────────────────────────────────────
SQLite-based caching for scraped comic chapters and image panel lists.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import sqlite3
import hashlib
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

try:
    from repositories.scraper import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

logger = logging.getLogger("sonikoma.services.scraper.cache")


class ChapterCacheManager:
    """SQLite-based caching for scraped comic chapters."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "database", "comic_chapters_cache.db"
        )
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database schema if needed."""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS chapter_cache (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title_no TEXT NOT NULL,
                        genre TEXT,
                        cache_key TEXT UNIQUE NOT NULL,
                        chapters_json TEXT NOT NULL,
                        series_metadata TEXT,
                        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME,
                        hit_count INTEGER DEFAULT 0
                    )
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_title_no_genre
                    ON chapter_cache(title_no, genre)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_expires_at
                    ON chapter_cache(expires_at)
                """)
                conn.commit()
            logger.info(f"[ChapterCacheManager] Database initialized at {self.db_path}")
        except Exception as e:
            logger.warning(f"[ChapterCacheManager] Failed to initialize: {e}")

    def _make_cache_key(self, title_no: str, genre: Optional[str] = None) -> str:
        """Generate cache key."""
        key_str = f"{title_no}:{genre or 'any'}"
        return hashlib.md5(key_str.encode(), usedforsecurity=False).hexdigest()

    def save_chapters(
        self,
        title_no: str,
        chapters: List[Dict[str, Any]],
        series_metadata: Optional[Dict[str, Any]] = None,
        genre: Optional[str] = None,
        ttl_hours: int = 24
    ) -> bool:
        """Save chapters to cache."""
        try:
            cache_key = self._make_cache_key(title_no, genre)
            expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

            chapters_json = json.dumps(chapters)
            metadata_json = json.dumps(series_metadata) if series_metadata else None

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO chapter_cache
                    (title_no, genre, cache_key, chapters_json, series_metadata, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (title_no, genre, cache_key, chapters_json, metadata_json, expires_at))
                conn.commit()

            logger.info(f"[ChapterCacheManager] Cached {len(chapters)} chapters for {title_no}")
            return True
        except Exception as e:
            logger.warning(f"[ChapterCacheManager] Save failed: {e}")
            return False

    def save_episodes(self, *args, **kwargs) -> bool:
        return self.save_chapters(*args, **kwargs)

    def get_chapters(self, title_no: str, genre: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieve chapters from cache if valid."""
        try:
            cache_key = self._make_cache_key(title_no, genre)

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT chapters_json, series_metadata, hit_count, expires_at
                    FROM chapter_cache
                    WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
                """, (cache_key,))

                row = cursor.fetchone()
                if row:
                    chapters_json, metadata_json, hit_count, _ = row

                    cursor.execute(
                        "UPDATE chapter_cache SET hit_count = hit_count + 1 WHERE cache_key = ?",
                        (cache_key,)
                    )
                    conn.commit()

                    chapters = json.loads(chapters_json)
                    metadata = json.loads(metadata_json) if metadata_json else None

                    logger.info(f"[ChapterCacheManager] Cache HIT for {title_no} ({len(chapters)} chapters, hits: {hit_count + 1})")
                    return {
                        "chapters": chapters,
                        "series_metadata": metadata,
                        "from_cache": True
                    }

                logger.debug(f"[ChapterCacheManager] Cache MISS for {title_no}")
                return None
        except Exception as e:
            logger.warning(f"[ChapterCacheManager] Retrieval failed: {e}")
            return None

    def get_episodes(self, *args, **kwargs) -> Optional[Dict[str, Any]]:
        return self.get_chapters(*args, **kwargs)

    def clear_expired(self) -> int:
        """Remove expired cache entries."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM chapter_cache WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
                )
                deleted = cursor.rowcount
                conn.commit()

            if deleted > 0:
                logger.info(f"[ChapterCacheManager] Cleared {deleted} expired entries")
            return deleted
        except Exception as e:
            logger.warning(f"[ChapterCacheManager] Clear failed: {e}")
            return 0


# Global cache manager instance
_chapter_cache = None

def get_chapter_cache() -> ChapterCacheManager:
    """Get global chapter cache manager."""
    global _chapter_cache
    if _chapter_cache is None:
        _chapter_cache = ChapterCacheManager()
    return _chapter_cache

EpisodeCacheManager = ChapterCacheManager
get_episode_cache = get_chapter_cache


def check_sqlite_cache(url: str) -> Optional[List[str]]:
    """Checks the latest scraped session cache for panel image URLs."""
    if get_latest_scrape_session:
        try:
            session = get_latest_scrape_session(url)
            if session and session.get('image_urls'):
                urls = session['image_urls']
                if any("data:" in str(u) or "data%" in str(u) or "svg" in str(u).lower() for u in urls):
                    return None
                logger.info(f"[Scraper] Cache HIT (SQLite persisted): {url}")
                return urls
        except Exception as e:
            logger.warning(f"[Scraper] SQLite cache read failed: {e}")
    return None


def save_sqlite_cache(url: str, images: List[str]) -> None:
    """Saves the scraped panel image URLs to the latest session cache database."""
    if save_scrape_session:
        try:
            save_scrape_session(url, images)
            logger.info(f"[Scraper] Cache WRITE (SQLite persisted): {len(images)} images for {url}")
        except Exception as e:
            logger.warning(f"[Scraper] SQLite cache write failed: {e}")
