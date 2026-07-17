"""
infrastructure/database/connection.py
─────────────────────────────────────────────────────────────────────────────
Compatibility shim — all symbols that were previously defined here now live
in focused sub-modules.  Import from those modules directly for new code.

Sub-modules:
  config.py      – path constants and DATABASE_URL / is_postgres flag
  engine.py      – PostgresCursorWrapper, PostgresConnectionWrapper,
                   _create_db_connection, get_db_connection
  migrations.py  – init_db, _should_skip_system_log_persistence,
                   initialisation state globals
  transaction.py – create_slug, generate_unique_slug,
                   generate_missing_slugs, unwrap_proxy_url
  health.py      – ensure_user_exists
  session.py     – uuid_hex, datetime_now_date
─────────────────────────────────────────────────────────────────────────────
"""

# ── config ────────────────────────────────────────────────────────────────
from infrastructure.database.config import (
    DB_DIR,
    DB_PATH,
    DATA_DIR,
    SCHEMA_PATH,
    SCHEMA_PG_PATH,
    DATABASE_URL,
    is_postgres as _is_postgres,
    LOW_BALANCE_THRESHOLD,
)

# ── engine ────────────────────────────────────────────────────────────────
from infrastructure.database.engine import (
    PostgresCursorWrapper,
    PostgresConnectionWrapper,
    _create_db_connection,
    get_db_connection,
)

# ── migrations ────────────────────────────────────────────────────────────
from infrastructure.database.migrations import (
    _db_initialized,
    _db_init_lock,
    _db_init_in_progress,
    _db_init_complete,
    _system_log_persist_in_progress,
    _should_skip_system_log_persistence,
    init_db,
)

# ── transaction (slug / URL helpers) ─────────────────────────────────────
from infrastructure.database.transaction import (
    create_slug,
    generate_unique_slug,
    generate_missing_slugs,
    unwrap_proxy_url,
)

# ── health ────────────────────────────────────────────────────────────────
from infrastructure.database.health import ensure_user_exists

# ── session helpers ───────────────────────────────────────────────────────
from infrastructure.database.session import uuid_hex, datetime_now_date

__all__ = [
    # config
    "DB_DIR", "DB_PATH", "DATA_DIR", "SCHEMA_PATH", "SCHEMA_PG_PATH",
    "DATABASE_URL", "_is_postgres", "LOW_BALANCE_THRESHOLD",
    # engine
    "PostgresCursorWrapper", "PostgresConnectionWrapper",
    "_create_db_connection", "get_db_connection",
    # migrations
    "_db_initialized", "_db_init_lock", "_db_init_in_progress",
    "_db_init_complete", "_system_log_persist_in_progress",
    "_should_skip_system_log_persistence", "init_db",
    # transaction
    "create_slug", "generate_unique_slug", "generate_missing_slugs",
    "unwrap_proxy_url",
    # health
    "ensure_user_exists",
    # session
    "uuid_hex", "datetime_now_date",
]
