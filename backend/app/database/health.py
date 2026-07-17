"""
infrastructure/database/health.py
─────────────────────────────────────────────────────────────────────────────
Database health / integrity helpers.

Provides:
  - ensure_user_exists() – guarantee a users row exists (creates a lightweight
                           fallback row for anonymous / system callers)
─────────────────────────────────────────────────────────────────────────────
"""

import sqlite3
import logging
from typing import Optional

logger = logging.getLogger("sonikoma.database.health")


def ensure_user_exists(
    conn: sqlite3.Connection,
    user_id: Optional[str],
    fallback_username: Optional[str] = None,
) -> str:
    """Ensure a user row exists so FK references from series/chapters stay valid.

    For anonymous scraper requests, a lightweight fallback user is created
    automatically. Returns the resolved (potentially normalised) user_id.
    """
    normalized_user_id = (user_id or "system_default").strip() or "system_default"

    existing = conn.execute(
        "SELECT id FROM users WHERE id = ? LIMIT 1", (normalized_user_id,)
    ).fetchone()
    if existing:
        return normalized_user_id

    username = (fallback_username or normalized_user_id).strip() or normalized_user_id
    email = f"{normalized_user_id}@local.invalid"
    conn.execute(
        """
        INSERT INTO users (id, username, email, password_hash,
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
