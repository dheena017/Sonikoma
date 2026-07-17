"""
infrastructure/database/bootstrap.py
─────────────────────────────────────────────────────────────────────────────
Database initialization orchestrator and startup guards.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import threading
import database.config as config
from database.engine import _create_db_connection

logger = logging.getLogger("sonikoma.database.bootstrap")

# ── Initialisation state ──────────────────────────────────────────────────

_db_initialized: bool = False
_db_init_lock = threading.Lock()
_db_init_in_progress: bool = False
_db_init_complete = threading.Event()
_system_log_persist_in_progress: bool = False


def _should_skip_system_log_persistence() -> bool:
    return _db_init_in_progress or (
        not _db_init_complete.is_set() and not _db_initialized
    )


def init_db() -> None:
    """Idempotent schema bootstrap. Thread-safe; safe to call from multiple
    workers simultaneously."""
    global _db_initialized, _db_init_in_progress

    if _db_initialized:
        return

    with _db_init_lock:
        if _db_initialized:
            return
        if _db_init_in_progress:
            wait_for_init = True
        else:
            _db_init_in_progress = True
            _db_init_complete.clear()
            wait_for_init = False

    if wait_for_init:
        _db_init_complete.wait(timeout=60)
        return

    try:
        if config.is_postgres:
            logger.info("[Database] Connecting to PostgreSQL (Supabase)...")
            conn = _create_db_connection()
            from database.migrations import init_postgres
            init_postgres(conn)
            logger.info("[Database] PostgreSQL ready [OK]")
        else:
            logger.info(f"[Database] Opening local SQLite database at: {config.DB_PATH}")
            os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
            os.makedirs(config.DB_DIR, exist_ok=True)
            conn = _create_db_connection()
            from database.migrations import init_sqlite
            init_sqlite(conn)
            logger.info("[Database] SQLite database ready [OK]")
    except Exception as e:
        logger.error(f"[Database] Error during database initialization: {e}")
        with _db_init_lock:
            _db_init_in_progress = False
            _db_init_complete.set()
        raise

    with _db_init_lock:
        _db_initialized = True
        _db_init_in_progress = False
        _db_init_complete.set()
