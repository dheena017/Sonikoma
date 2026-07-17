"""
infrastructure/database/engine.py
─────────────────────────────────────────────────────────────────────────────
Raw connection creation: SQLite and PostgreSQL wrappers.

Provides:
  - PostgresCursorWrapper   – translates SQLite query syntax to Postgres
  - PostgresConnectionWrapper – wraps psycopg2 connection behind sqlite3-like API
  - _create_db_connection() – low-level factory (no init check)
  - get_db_connection()     – public entry point (triggers init_db if needed)
─────────────────────────────────────────────────────────────────────────────
"""

import sqlite3
import logging

from infrastructure.database.config import DATABASE_URL, DB_PATH, is_postgres

try:
    import psycopg2
    from psycopg2.extras import DictCursor
except ImportError:
    psycopg2 = None  # type: ignore[assignment]

logger = logging.getLogger("sonikoma.database.engine")


# ── PostgreSQL compatibility wrappers ─────────────────────────────────────


class PostgresCursorWrapper:
    """Translates SQLite-style queries (? placeholders, datetime('now')) to
    their Postgres equivalents and normalises the fetch interface."""

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

    def close(self):
        self.cursor.close()


class PostgresConnectionWrapper:
    """Wraps a psycopg2 connection behind a sqlite3-compatible interface."""

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

    def close(self):
        self.conn.close()


# ── Connection factory ────────────────────────────────────────────────────


def _create_db_connection():
    """Create a raw database connection (SQLite or Postgres).

    Does NOT trigger init_db — call get_db_connection() for the guarded
    public version.
    """
    if is_postgres:
        if not psycopg2:
            raise RuntimeError(
                "psycopg2-binary is required for PostgreSQL support. "
                "Please install it."
            )
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=DictCursor)
        return PostgresConnectionWrapper(conn)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # WAL improves concurrency, but can fail on read-only / transient mounts.
    # Degrade gracefully so auth and read paths keep working.
    try:
        conn.execute("PRAGMA journal_mode = WAL")
    except sqlite3.OperationalError as e:
        logger.warning(
            "[Database] PRAGMA journal_mode=WAL failed; continuing without WAL. "
            f"error={e}"
        )
        try:
            conn.execute("PRAGMA journal_mode = DELETE")
        except Exception:
            pass

    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def get_db_connection():
    """Public entry point — ensures the schema is initialised before returning
    a connection. Import init_db lazily to avoid circular imports."""
    # Deferred import keeps engine.py independent of migrations.py
    from infrastructure.database.migrations import _db_initialized, init_db

    if not _db_initialized:
        init_db()
    return _create_db_connection()
