"""
infrastructure/database/session.py
─────────────────────────────────────────────────────────────────────────────
Lightweight session / identifier helpers used across the application.

Provides:
  - uuid_hex()          – short 8-character hex ID
  - datetime_now_date() – today's date as "YYYY-MM-DD"
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import datetime


def uuid_hex() -> str:
    """Return a short 8-character hex string from a random UUID."""
    return uuid.uuid4().hex[:8]


def datetime_now_date() -> str:
    """Return today's date formatted as YYYY-MM-DD."""
    return datetime.datetime.now().strftime("%Y-%m-%d")
