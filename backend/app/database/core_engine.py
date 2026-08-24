"""
backend/app/database/core_engine.py
─────────────────────────────────────────────────────────────────────────────
Compatibility re-export layer forwarding to engine.py.
─────────────────────────────────────────────────────────────────────────────
"""

try:
    from .engine import (
        PostgresCursorWrapper,
        PostgresConnectionWrapper,
        _create_db_connection,
    )
except ImportError:
    from database.engine import (
        PostgresCursorWrapper,
        PostgresConnectionWrapper,
        _create_db_connection,
    )

__all__ = [
    "PostgresCursorWrapper",
    "PostgresConnectionWrapper",
    "_create_db_connection",
]
