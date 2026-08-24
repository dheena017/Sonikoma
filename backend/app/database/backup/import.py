"""
backend/app/database/backup/import.py
─────────────────────────────────────────────────────────────────────────────
Compatibility wrapper forwarding to import_sql.py.
─────────────────────────────────────────────────────────────────────────────
"""

try:
    from .import_sql import import_database
except ImportError:
    from database.backup.import_sql import import_database

__all__ = ["import_database"]
