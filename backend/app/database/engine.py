"""
backend/app/database/engine.py
─────────────────────────────────────────────────────────────────────────────
Database connection engine: SQLite and PostgreSQL connection factories
and query compatibility wrappers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sqlite3
import logging
from typing import Union, Optional, Any

try:
    from . import config
except ImportError:
    import database.config as config

try:
    import psycopg2
    from psycopg2.extras import DictCursor
except ImportError:
    psycopg2 = None
    DictCursor = None

logger = logging.getLogger("sonikoma.database.engine")


class PostgresCursorWrapper:
    """Cursor wrapper translating SQLite parameter style (?) to PostgreSQL (%s)."""

    def __init__(self, cursor):
        self.cursor = cursor

    def _translate_query(self, query: str) -> str:
        query = query.replace("?", "%s")
        query = query.replace("datetime('now')", "NOW()")
        return query

    def execute(self, query: str, params=None):
        translated = self._translate_query(query)
        self.cursor.execute(translated, params or ())
        return self

    def fetchone(self):
        try:
            return self.cursor.fetchone()
        except Exception:
            return None

    def fetchall(self):
        try:
            rows = self.cursor.fetchall()
            return [dict(r) for r in rows]
        except Exception:
            return []

    @property
    def rowcount(self) -> int:
        return self.cursor.rowcount

    def close(self):
        self.cursor.close()


class PostgresConnectionWrapper:
    """Connection wrapper presenting a consistent interface for PostgreSQL."""

    def __init__(self, conn):
        self.conn = conn

    def cursor(self) -> PostgresCursorWrapper:
        return PostgresCursorWrapper(self.conn.cursor())

    def execute(self, query: str, params=None):
        cursor = self.cursor()
        return cursor.execute(query, params)

    def executescript(self, script: str):
        cursor = self.cursor()
        cursor.execute(script)

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def close(self):
        self.conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type:
            self.conn.rollback()
        else:
            self.conn.commit()
        return False


def _create_db_connection() -> Union[PostgresConnectionWrapper, sqlite3.Connection]:
    """Low-level connection factory without initialization checks."""
    if config.is_postgres:
        if not psycopg2:
            raise RuntimeError(
                "psycopg2-binary is required for PostgreSQL support. Please install it."
            )
        db_url = config.DATABASE_URL
        if not db_url:
            raise RuntimeError("DATABASE_URL must be configured when PostgreSQL mode is enabled.")
        if "sslmode=" not in db_url:
            sep = "&" if "?" in db_url else "?"
            db_url = f"{db_url}{sep}sslmode=require"
        try:
            conn = psycopg2.connect(db_url, cursor_factory=DictCursor, connect_timeout=15)
        except Exception as err:
            logger.warning(f"[Database] Initial PostgreSQL connection failed: {err}. Retrying...")
            conn = psycopg2.connect(db_url, cursor_factory=DictCursor, connect_timeout=20)
        return PostgresConnectionWrapper(conn)

    conn = sqlite3.connect(config.DB_PATH)
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


def get_db_connection() -> Union[PostgresConnectionWrapper, sqlite3.Connection]:
    """Public entry point: ensures the database schema is initialised before returning connection."""
    try:
        from . import bootstrap
    except ImportError:
        import database.bootstrap as bootstrap

    if not bootstrap._db_initialized:
        bootstrap.init_db()
    return _create_db_connection()
