"""SQLite database export helpers."""

from __future__ import annotations

from pathlib import Path

from database.engine import get_db_connection


def export_sqlite_database(output_path: str | Path) -> Path:
    """Export the active SQLite database to a SQL dump file."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    conn = get_db_connection()
    try:
        if not hasattr(conn, "iterdump"):
            raise RuntimeError("SQL dump export is only available for SQLite connections.")
        path.write_text("\n".join(conn.iterdump()), encoding="utf-8")
    finally:
        conn.close()
    return path
