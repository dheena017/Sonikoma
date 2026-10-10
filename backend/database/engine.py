"""
backend/database/engine.py
─────────────────────────────────────────────────────────────────────────────
Database connection engine: SQLite connection factory with WAL mode,
foreign key enforcement, and automatic initialization bootstrapping.
─────────────────────────────────────────────────────────────────────────────
"""

import sqlite3
import logging

from database import config

logger = logging.getLogger("sonikoma.database.engine")


def _create_db_connection() -> sqlite3.Connection:
    """Low-level SQLite connection factory with WAL and foreign key pragmas."""
    conn = sqlite3.connect(config.DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row

    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except sqlite3.OperationalError as e:
        logger.warning(f"[Database] PRAGMA journal_mode=WAL failed: {e}")
        try:
            conn.execute("PRAGMA journal_mode = DELETE")
        except Exception:
            pass

    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_db_connection() -> sqlite3.Connection:
    """
    Public entry point: ensures the database schema is initialized before
    returning an active connection with Row factory.
    """
    from database import bootstrap

    if not bootstrap.is_database_initialized():
        bootstrap.init_db()

    return _create_db_connection()
