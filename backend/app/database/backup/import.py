"""Database import helpers."""

from __future__ import annotations

from pathlib import Path

from database.engine import get_db_connection


def import_database(sql_dump_path: str | Path) -> None:
    """Import a SQLite SQL dump into the active database."""
    path = Path(sql_dump_path)
    script = path.read_text(encoding="utf-8")

    conn = get_db_connection()
    try:
        conn.executescript(script)
        conn.commit()
    finally:
        conn.close()
