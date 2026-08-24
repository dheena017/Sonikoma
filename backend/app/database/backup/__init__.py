"""
backend/app/database/backup/__init__.py
─────────────────────────────────────────────────────────────────────────────
Database export, import, and restoration helpers.
─────────────────────────────────────────────────────────────────────────────
"""

try:
    from .export import export_sqlite_database
    from .restore import restore_sqlite_database
    from .import_sql import import_database
except ImportError:
    from database.backup.export import export_sqlite_database
    from database.backup.restore import restore_sqlite_database
    from database.backup.import_sql import import_database

__all__ = [
    "export_sqlite_database",
    "restore_sqlite_database",
    "import_database",
]
