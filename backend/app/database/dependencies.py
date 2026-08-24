"""
backend/app/database/dependencies.py
─────────────────────────────────────────────────────────────────────────────
FastAPI database connection dependencies.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from typing import Generator

try:
    from .engine import get_db_connection
except ImportError:
    from database.engine import get_db_connection


def get_db() -> Generator:
    """Yield the active database connection and close it after request completion."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
