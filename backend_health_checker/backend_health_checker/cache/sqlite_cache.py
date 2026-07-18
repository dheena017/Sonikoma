import sqlite3
import json
from pathlib import Path
from typing import Optional, Dict, Any
import threading

class SQLiteCache:
    """Thread-safe SQLite persistent cache for incremental scanning."""
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._local = threading.local()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        if not hasattr(self._local, "conn"):
             # SQLite allows multithreading with timeout and isolation_level tweaks
             self._local.conn = sqlite3.connect(str(self.db_path), timeout=10.0, isolation_level=None)
        return self._local.conn

    def _init_db(self):
        conn = self._get_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS file_cache (
                path TEXT PRIMARY KEY,
                content_hash TEXT,
                mtime REAL,
                ast_json TEXT
            )
        """)

    def get_file_state(self, path: str) -> Optional[Dict[str, Any]]:
        conn = self._get_conn()
        cur = conn.execute("SELECT content_hash, mtime, ast_json FROM file_cache WHERE path = ?", (path,))
        row = cur.fetchone()
        if row:
            return {
                "content_hash": row[0],
                "mtime": row[1],
                "ast_json": json.loads(row[2]) if row[2] else None
            }
        return None

    def set_file_state(self, path: str, content_hash: str, mtime: float, ast_data: Optional[Dict[str, Any]] = None):
        conn = self._get_conn()
        ast_str = json.dumps(ast_data) if ast_data else None
        conn.execute("""
            INSERT INTO file_cache (path, content_hash, mtime, ast_json)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                content_hash=excluded.content_hash,
                mtime=excluded.mtime,
                ast_json=excluded.ast_json
        """, (path, content_hash, mtime, ast_str))
