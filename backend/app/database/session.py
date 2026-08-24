"""
backend/app/database/session.py
─────────────────────────────────────────────────────────────────────────────
Database session, ID, and datetime utility helpers.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import datetime
import uuid


def uuid_hex(length: int = 8) -> str:
    """Return a short hex string from a random UUID."""
    return uuid.uuid4().hex[:length]


def datetime_now_date() -> str:
    """Return today's date formatted as YYYY-MM-DD."""
    return datetime.datetime.now().strftime("%Y-%m-%d")


def datetime_now_iso() -> str:
    """Return current UTC timestamp in ISO 8601 format."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat()
