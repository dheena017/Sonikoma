"""
infrastructure/database/transaction.py
─────────────────────────────────────────────────────────────────────────────
Slug helpers and miscellaneous query utilities.

Provides:
  - create_slug()              – convert title → URL-safe slug
  - generate_unique_slug()     – append counter until slug is unique in a table
  - generate_missing_slugs()   – backfill slugs for existing rows
  - unwrap_proxy_url()         – unwrap nested /api/proxy-image URLs
─────────────────────────────────────────────────────────────────────────────
"""

import re
import uuid
import sqlite3
import logging
import urllib.parse
from typing import Optional

logger = logging.getLogger("sonikoma.database.transaction")


# ── Slug helpers ──────────────────────────────────────────────────────────


def create_slug(title: str) -> str:
    """Convert a title into a URL-friendly slug. Supports Unicode characters."""
    if not title:
        return ""
    slug = title.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)       # strip punctuation except - and space
    slug = re.sub(r"[\s_]+", "-", slug)         # spaces / underscores → dash
    slug = re.sub(r"-+", "-", slug)             # collapse multiple dashes
    return slug.strip("-")


def generate_unique_slug(title: str, table: str, conn: sqlite3.Connection) -> str:
    """Generate a unique slug, appending an integer counter when needed."""
    base_slug = create_slug(title)
    if not base_slug:
        base_slug = f"untitled-{uuid.uuid4().hex[:6]}"

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
            "SELECT id, title FROM series WHERE slug IS NULL"
        ).fetchall()
        for r in rows:
            unique_slug = generate_unique_slug(r["title"], "series", conn)
            conn.execute("UPDATE series SET slug = ? WHERE id = ?", (unique_slug, r["id"]))

        rows = conn.execute(
            """
            SELECT c.id, c.episode_number, s.title AS series_title
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.slug IS NULL
            """
        ).fetchall()
        for r in rows:
            base_title = f"{r['series_title']} {r['episode_number']}"
            unique_slug = generate_unique_slug(base_title, "chapters", conn)
            conn.execute("UPDATE chapters SET slug = ? WHERE id = ?", (unique_slug, r["id"]))

        conn.commit()
    except Exception as e:
        logger.error(f"[Database] Error generating missing slugs: {e}")


# ── URL helpers ───────────────────────────────────────────────────────────


def unwrap_proxy_url(url_str: str) -> str:
    """Recursively unwrap nested /api/proxy-image redirect URLs."""
    if not url_str:
        return ""
    current = url_str.strip()
    while "/api/proxy-image" in current:
        parsed = urllib.parse.urlparse(current)
        query = urllib.parse.parse_qs(parsed.query)
        if "url" in query:
            current = query["url"][0]
        else:
            break
    return current
