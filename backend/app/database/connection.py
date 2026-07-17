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
import database.config as config
from database.config import (
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
from database.engine import (
    PostgresCursorWrapper,
    PostgresConnectionWrapper,
    _create_db_connection,
    get_db_connection,
)

# ── migrations ────────────────────────────────────────────────────────────
import database.bootstrap as migrations
from database.bootstrap import (
    _db_initialized,
    _db_init_lock,
    _db_init_in_progress,
    _db_init_complete,
    _system_log_persist_in_progress,
    _should_skip_system_log_persistence,
    init_db,
)

# ── transaction (slug / URL helpers) ─────────────────────────────────────
from database.transaction import (
    create_slug,
    generate_unique_slug,
    generate_missing_slugs,
    managed_transaction,
    unwrap_proxy_url,
)

# ── health ────────────────────────────────────────────────────────────────
from database.health import ensure_user_exists

# ── session helpers ───────────────────────────────────────────────────────
from database.session import uuid_hex, datetime_now_date

import sys
import types

class ConnectionShimModule(types.ModuleType):
    def __getattr__(self, name):
        if name in ("DB_PATH", "DB_DIR", "DATA_DIR", "SCHEMA_PATH", "SCHEMA_PG_PATH", "DATABASE_URL", "LOW_BALANCE_THRESHOLD"):
            return getattr(config, name)
        if name in ("_is_postgres", "is_postgres"):
            return getattr(config, "is_postgres")
        if name in ("_db_initialized", "_db_init_lock", "_db_init_in_progress", "_db_init_complete", "_system_log_persist_in_progress"):
            return getattr(migrations, name)
        
        # Fall back to attributes on connection.py itself
        raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

    def __setattr__(self, name, value):
        if name in ("_submodules", "__all__", "__class__"):
            super().__setattr__(name, value)
            return

        if name in ("DB_PATH", "DB_DIR", "DATA_DIR", "SCHEMA_PATH", "SCHEMA_PG_PATH", "DATABASE_URL", "LOW_BALANCE_THRESHOLD"):
            setattr(config, name, value)
            return
        if name in ("_is_postgres", "is_postgres"):
            setattr(config, "is_postgres", value)
            return
        if name in ("_db_initialized", "_db_init_lock", "_db_init_in_progress", "_db_init_complete", "_system_log_persist_in_progress"):
            setattr(migrations, name, value)
            return

        super().__setattr__(name, value)

sys.modules[__name__].__class__ = ConnectionShimModule

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
    "managed_transaction", "unwrap_proxy_url",
    # health
    "ensure_user_exists",
    # session
    "uuid_hex", "datetime_now_date",
]
