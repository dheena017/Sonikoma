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
from database.core_engine import PostgresCursorWrapper, PostgresConnectionWrapper, _create_db_connection

def get_db_connection():

    """Public entry point — ensures the schema is initialised before returning
    a connection. Import init_db lazily to avoid circular imports."""
    # Deferred import keeps engine.py independent of bootstrap.py
    import database.bootstrap as bootstrap

    if not bootstrap._db_initialized:
        bootstrap.init_db()
    return _create_db_connection()
