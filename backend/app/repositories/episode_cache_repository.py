"""
backend/app/services/scraper/cache.py
─────────────────────────────────────────────────────────────────────────────
SQLite-based caching for scraped WEBTOON episodes and image panel lists.
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
    from repositories.scraper_repository import save_scrape_session, get_latest_scrape_session
except ImportError:
    save_scrape_session = None
    get_latest_scrape_session = None

logger = logging.getLogger("sonikoma.services.scraper.cache")


class EpisodeCacheManager:
    """SQLite-based caching for scraped WEBTOON episodes."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or os.path.join(
            os.path.dirname(__file__), "..", "..", "..", "database", "webtoon_episodes_cache.db"
        )
        self._init_db()

    def _init_db(self):
        """Initialize SQLite database schema if needed."""
        try:
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS episode_cache (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title_no TEXT NOT NULL,
                        genre TEXT,
                        cache_key TEXT UNIQUE NOT NULL,
                        episodes_json TEXT NOT NULL,
                        series_metadata TEXT,
                        cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        expires_at DATETIME,
                        hit_count INTEGER DEFAULT 0
                    )
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_title_no_genre
                    ON episode_cache(title_no, genre)
                """)
                cursor.execute("""
                    CREATE INDEX IF NOT EXISTS idx_expires_at
                    ON episode_cache(expires_at)
                """)
                conn.commit()
            logger.info(f"[Cache Manager] Database initialized at {self.db_path}")
        except Exception as e:
            logger.warning(f"[Cache Manager] Failed to initialize: {e}")

    def _make_cache_key(self, title_no: str, genre: Optional[str] = None) -> str:
        """Generate cache key."""
        key_str = f"{title_no}:{genre or 'any'}"
        return hashlib.md5(key_str.encode()).hexdigest()

    def save_episodes(
        self,
        title_no: str,
        episodes: List[Dict[str, Any]],
        series_metadata: Optional[Dict[str, Any]] = None,
        genre: Optional[str] = None,
        ttl_hours: int = 24
    ) -> bool:
        """Save episodes to cache."""
        try:
            cache_key = self._make_cache_key(title_no, genre)
            expires_at = datetime.utcnow() + timedelta(hours=ttl_hours)

            episodes_json = json.dumps(episodes)
            metadata_json = json.dumps(series_metadata) if series_metadata else None

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO episode_cache
                    (title_no, genre, cache_key, episodes_json, series_metadata, expires_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (title_no, genre, cache_key, episodes_json, metadata_json, expires_at))
                conn.commit()

            logger.info(f"[Cache Manager] Cached {len(episodes)} episodes for {title_no}")
            return True
        except Exception as e:
            logger.warning(f"[Cache Manager] Save failed: {e}")
            return False

    def get_episodes(self, title_no: str, genre: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieve episodes from cache if valid."""
        try:
            cache_key = self._make_cache_key(title_no, genre)

            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT episodes_json, series_metadata, hit_count, expires_at
                    FROM episode_cache
                    WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
                """, (cache_key,))

                row = cursor.fetchone()
                if row:
                    episodes_json, metadata_json, hit_count, _ = row

                    # Update hit count
                    cursor.execute(
                        "UPDATE episode_cache SET hit_count = hit_count + 1 WHERE cache_key = ?",
                        (cache_key,)
                    )
                    conn.commit()

                    episodes = json.loads(episodes_json)
                    metadata = json.loads(metadata_json) if metadata_json else None

                    logger.info(f"[Cache Manager] Cache HIT for {title_no} ({len(episodes)} episodes, hits: {hit_count + 1})")
                    return {
                        "episodes": episodes,
                        "series_metadata": metadata,
                        "from_cache": True
                    }

                logger.debug(f"[Cache Manager] Cache MISS for {title_no}")
                return None
        except Exception as e:
            logger.warning(f"[Cache Manager] Retrieval failed: {e}")
            return None

    def clear_expired(self) -> int:
        """Remove expired cache entries."""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "DELETE FROM episode_cache WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
                )
                deleted = cursor.rowcount
                conn.commit()

            if deleted > 0:
                logger.info(f"[Cache Manager] Cleared {deleted} expired entries")
            return deleted
        except Exception as e:
            logger.warning(f"[Cache Manager] Clear failed: {e}")
            return 0


# Global cache manager instance
_episode_cache = None

def get_episode_cache() -> EpisodeCacheManager:
    """Get global episode cache manager."""
    global _episode_cache
    if _episode_cache is None:
        _episode_cache = EpisodeCacheManager()
    return _episode_cache


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
