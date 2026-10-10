"""
backend/database/utils.py
─────────────────────────────────────────────────────────────────────────────
Unified database utility helpers:
- UUID & Datetime generators
- URL-safe slug formatting & backfilling
- Transaction context management
- Proxy URL unwrapping
- Entity existence validation
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import datetime
import logging
import re
import sqlite3
import urllib.parse
import uuid
from contextlib import contextmanager
from typing import Any, Iterator, Optional

logger = logging.getLogger("sonikoma.database.utils")


# ── UUID & Datetime Helpers ────────────────────────────────────────────────


def uuid_hex(length: int = 8) -> str:
    """Return a short hex string from a random UUID."""
    return uuid.uuid4().hex[:length]


def datetime_now_date() -> str:
    """Return today's date formatted as YYYY-MM-DD."""
    return datetime.datetime.now().strftime("%Y-%m-%d")


def datetime_now_iso() -> str:
    """Return current UTC timestamp in ISO 8601 format."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ── Slug Helpers ───────────────────────────────────────────────────────────


def create_slug(title: str) -> str:
    """Convert a title into a URL-friendly slug. Supports Unicode characters."""
    if not title:
        return ""
    slug = title.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug.strip("-")


def generate_unique_slug(title: str, table: str, conn: Any) -> str:
    """Generate a unique slug, appending an integer counter when needed."""
    base_slug = create_slug(title)
    if not base_slug:
        base_slug = f"untitled-{uuid_hex(6)}"

    slug = base_slug
    counter = 1
    while True:
        row = conn.execute(
            f"SELECT id FROM {table} WHERE slug = ? LIMIT 1", (slug,)
        ).fetchone()
        if not row:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


def generate_missing_slugs(conn: sqlite3.Connection) -> None:
    """Backfill slugs for existing series and chapter rows that have none."""
    try:
        rows = conn.execute(
            "SELECT id, title FROM platform_series WHERE slug IS NULL"
        ).fetchall()
        for r in rows:
            unique_slug = generate_unique_slug(r["title"], "platform_series", conn)
            conn.execute("UPDATE platform_series SET slug = ? WHERE id = ?", (unique_slug, r["id"]))

        rows = conn.execute(
            """
            SELECT c.id, c.episode_number, s.title AS series_title
            FROM workspace_chapters c
            JOIN platform_series s ON c.series_id = s.id
            WHERE c.slug IS NULL
            """
        ).fetchall()
        for r in rows:
            base_title = f"{r['series_title']} {r['episode_number']}"
            unique_slug = generate_unique_slug(base_title, "workspace_chapters", conn)
            conn.execute("UPDATE workspace_chapters SET slug = ? WHERE id = ?", (unique_slug, r["id"]))

        conn.commit()
    except Exception as e:
        logger.error(f"[Database] Error generating missing slugs: {e}")


# ── Transaction Context ───────────────────────────────────────────────────


@contextmanager
def managed_transaction(conn: Any) -> Iterator:
    """Commit on success and roll back if the enclosed DB work fails."""
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


# ── URL Helpers ───────────────────────────────────────────────────────────


def unwrap_proxy_url(url_str: Optional[str]) -> str:
    """Recursively unwrap nested /api/proxy-image redirect URLs."""
    if not url_str:
        return ""
    current = url_str.strip()
    while "/api/v1/proxy/image" in current:
        parsed = urllib.parse.urlparse(current)
        query = urllib.parse.parse_qs(parsed.query)
        if "url" in query:
            current = query["url"][0]
        else:
            break
    return current


# ── Health & Integrity Helpers ────────────────────────────────────────────


def ensure_user_exists(
    conn: Any,
    user_id: Optional[str],
    fallback_username: Optional[str] = None,
) -> str:
    """Ensure a user row exists so FK references from series and chapters stay valid.

    For anonymous scraper requests, a lightweight fallback user is created
    automatically. Returns the resolved user_id.
    """
    normalized_user_id = (user_id or "system_default").strip() or "system_default"

    existing = conn.execute(
        "SELECT id FROM auth_users WHERE id = ? LIMIT 1", (normalized_user_id,)
    ).fetchone()
    if existing:
        return normalized_user_id

    username = (fallback_username or normalized_user_id).strip() or normalized_user_id
    email = f"{normalized_user_id}@local.invalid"
    conn.execute(
        """
        INSERT INTO auth_users (id, username, email, password_hash,
                           preferences, avatar_url, full_name, google_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            normalized_user_id,
            username,
            email,
            "system_generated",
            "{}",
            None,
            None,
            None,
        ),
    )
    return normalized_user_id


__all__ = [
    "uuid_hex",
    "datetime_now_date",
    "datetime_now_iso",
    "create_slug",
    "generate_unique_slug",
    "generate_missing_slugs",
    "managed_transaction",
    "unwrap_proxy_url",
    "ensure_user_exists",
]
