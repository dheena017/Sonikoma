"""
backend/app/repositories/scraper_repository.py
─────────────────────────────────────────────────────────────────────────────
Scraping session and edit history database repository.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import sqlite3
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# Import DB connection helpers
from infrastructure.database.connection import (
    get_db_connection, uuid_hex, datetime_now_date, create_slug,
    generate_unique_slug, generate_missing_slugs, unwrap_proxy_url,
    ensure_user_exists, _is_postgres, LOW_BALANCE_THRESHOLD
)

logger = logging.getLogger("sonikoma.repositories.scraper_repository")

def save_scrape_session(url: str, image_urls: List[str]) -> None:
    """Save a scrape session result."""
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


def get_edit_history(edited_url: str) -> Optional[Dict[str, Any]]:
    """Get the previous URL before an edit (for undo)."""
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM edit_history WHERE edited_url = ?', (edited_url,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


