"""Database package.

This package keeps the existing raw connection helpers available while adding
an SQLAlchemy-ready structure for models, session management, migrations,
fixtures, seed data, and backup utilities.
"""

from database.bootstrap import init_db
from database.engine import get_db_connection

__all__ = ["get_db_connection", "init_db"]
