"""
backend/app/repositories/scraper_repository.py
─────────────────────────────────────────────────────────────────────────────
Scraping session and edit history database repository.
─────────────────────────────────────────────────────────────────────────────
"""

import json

import logging
from typing import List, Dict, Any, Optional

# Import DB connection helpers
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.repositories.scraper_repository")

def _ensure_tables():
    """Ensure scrape_sessions and edit_history tables exist and have required columns."""
    try:
        with get_db_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS scrape_sessions (
              id          INTEGER PRIMARY KEY AUTOINCREMENT,
              url         TEXT,
              image_urls  TEXT,
              panel_count INTEGER DEFAULT 0,
              scraped_at  TEXT
            )
            """)
            cols = [r["name"] for r in conn.execute("PRAGMA table_info(scrape_sessions)").fetchall()]
            if "url" not in cols:
                conn.execute("ALTER TABLE scrape_sessions ADD COLUMN url TEXT")
            if "image_urls" not in cols:
                conn.execute("ALTER TABLE scrape_sessions ADD COLUMN image_urls TEXT")
            if "panel_count" not in cols:
                conn.execute("ALTER TABLE scrape_sessions ADD COLUMN panel_count INTEGER DEFAULT 0")
            if "scraped_at" not in cols:
                conn.execute("ALTER TABLE scrape_sessions ADD COLUMN scraped_at TEXT")

            conn.execute("CREATE INDEX IF NOT EXISTS idx_scrape_url ON scrape_sessions(url)")
            conn.execute("""
            CREATE TABLE IF NOT EXISTS edit_history (
              id           INTEGER PRIMARY KEY AUTOINCREMENT,
              edited_url   TEXT    NOT NULL UNIQUE,
              original_url TEXT    NOT NULL,
              edit_type    TEXT    NOT NULL DEFAULT 'crop',
              created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """)
            conn.commit()
    except Exception as e:
        logger.warning(f"[ScraperRepository] Table verification notice: {e}")

_ensure_tables()

def save_scrape_session(url: str, image_urls: List[str]) -> None:
    """Save a scrape session result."""
    _ensure_tables()
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO scrape_sessions (url, image_urls, panel_count)
            VALUES (?, ?, ?)
        """, (url, json.dumps(image_urls), len(image_urls)))
        conn.commit()
    finally:
        conn.close()


def get_latest_scrape_session(url: str) -> Optional[Dict[str, Any]]:
    """Get the latest scrape session for a URL (for cache reuse)."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT * FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1
        """, (url,)).fetchone()
        if row:
            res = dict(row)
            res['image_urls'] = json.loads(res['image_urls'])
            return res
        return None
    finally:
        conn.close()


def save_edit_history(edited_url: str, original_url: str, edit_type: str = 'edit') -> None:
    """Persist an edit history entry (for undo support across restarts)."""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO edit_history (edited_url, original_url, edit_type)
            VALUES (?, ?, ?)
        """, (edited_url, original_url, edit_type))
        conn.commit()
    finally:
        conn.close()


def delete_scrape_session(url: str) -> None:
    """Delete scrape session for a URL."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM scrape_sessions WHERE url = ?", (url,))
        conn.commit()
    finally:
        conn.close()


# Canonical aliases
get_scrape_session = get_latest_scrape_session


