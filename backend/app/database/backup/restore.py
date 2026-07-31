"""Database restore helpers."""

from __future__ import annotations

from pathlib import Path
from shutil import copy2

import database.config as config


def restore_sqlite_database(
    backup_path: str | Path,
    destination_path: str | Path | None = None,
) -> Path:
    """Restore a SQLite database file from a backup copy."""
    source = Path(backup_path)
    destination = Path(destination_path or config.DB_PATH)
    destination.parent.mkdir(parents=True, exist_ok=True)
    copy2(source, destination)
    return destination
