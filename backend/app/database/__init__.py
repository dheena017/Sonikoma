"""
backend/app/database/__init__.py
─────────────────────────────────────────────────────────────────────────────
Database infrastructure package providing database initialization, schema,
and connection factories.
─────────────────────────────────────────────────────────────────────────────
"""

from app.database.engine import get_db_connection
from app.database.bootstrap import init_db

__all__ = ["get_db_connection", "init_db"]
