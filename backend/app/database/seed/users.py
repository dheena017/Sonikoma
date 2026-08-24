"""
backend/app/database/seed/users.py
─────────────────────────────────────────────────────────────────────────────
User seed helpers for system and fallback users.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

try:
    from ..health import ensure_user_exists
except ImportError:
    from database.health import ensure_user_exists


def seed_system_user(conn, user_id: str = "system_default") -> str:
    """Ensure the default system user exists."""
    resolved_user_id = ensure_user_exists(conn, user_id, fallback_username="system")
    conn.commit()
    return resolved_user_id
