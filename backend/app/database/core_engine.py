"""
infrastructure/database/core_engine.py
─────────────────────────────────────────────────────────────────────────────
Base connection factory without initialization dependencies.
─────────────────────────────────────────────────────────────────────────────
"""
import sqlite3
import logging
import database.config as config

try:
    import psycopg2
    from psycopg2.extras import DictCursor
except ImportError:
    psycopg2 = None

logger = logging.getLogger("sonikoma.database.core_engine")

class PostgresCursorWrapper:
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

def _create_db_connection():
    if config.is_postgres:
        if not psycopg2:
            raise RuntimeError(
                "psycopg2-binary is required for PostgreSQL support. "
                "Please install it."
            )
        conn = psycopg2.connect(config.DATABASE_URL, cursor_factory=DictCursor)
        return PostgresConnectionWrapper(conn)

    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = sqlite3.Row

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
