"""
backend/database/bootstrap.py
─────────────────────────────────────────────────────────────────────────────
Database initialization orchestrator and thread-safe startup guards.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import threading

from database import config, migrator
from database.engine import _create_db_connection

logger = logging.getLogger("sonikoma.database.bootstrap")

# ── Concurrency & Initialization Guards ────────────────────────────────────

_db_initialized: bool = False
_db_init_lock = threading.Lock()
_db_init_in_progress: bool = False
_db_init_complete = threading.Event()
_system_log_persist_in_progress: bool = False


def _should_skip_system_log_persistence() -> bool:
    """Guard against logging to system_logs before tables are created."""
    return _db_init_in_progress or not _db_initialized


def is_database_initialized() -> bool:
    """Check if database initialization has completed."""
    return _db_initialized


def init_db() -> None:
    """
    Idempotent, thread-safe database bootstrap.
    Safe to call concurrently from multiple workers during application startup.
    """
    global _db_initialized, _db_init_in_progress

    # Fast-path check without acquiring lock
    if _db_initialized:
        return

    with _db_init_lock:
        # Double-check inside mutex
        if _db_initialized:
            return

        _db_init_in_progress = True
        _db_init_complete.clear()

        try:
            # Ensure local SQLite directory exists
            os.makedirs(os.path.dirname(config.DB_PATH), exist_ok=True)
            os.makedirs(config.DB_DIR, exist_ok=True)

            conn = _create_db_connection()
            migrator.init_sqlite(conn)
            _db_initialized = True
            logger.info(f"[Database] SQLite database ready at {config.DB_PATH} [OK]")

        except Exception as e:
            logger.error(f"[Database] Error during database initialization: {e}")
            if os.getenv("RENDER") or os.getenv("NODE_ENV") == "production":
                logger.warning(
                    "[Database] Non-fatal database initialization warning in production environment; "
                    "server will continue booting to open HTTP port."
                )
                return
            raise

        finally:
            _db_init_in_progress = False
            _db_init_complete.set()
