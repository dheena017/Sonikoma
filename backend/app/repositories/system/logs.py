"""
backend/app/repositories/system/logs.py
─────────────────────────────────────────────────────────────────────────────
System and audit logs operations. Fixes NameError by referencing
connection module globals.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional

from database.connection import get_db_connection
import database.connection as db_conn
from repositories.system.settings import get_platform_settings

logger = logging.getLogger("sonikoma.repositories.system.logs")


def get_global_audit_logs(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute('''
            SELECT a.id, a.user_id, u.email, a.event as action, a.ip as ip_address, a.status, a.created_at
            FROM user_audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC LIMIT ?
        ''', (limit,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def insert_system_log(level: str, module: str, message: str, details: Optional[str] = None, correlation_id: Optional[str] = None, user_id: Optional[str] = None, snapshot: Optional[str] = None) -> None:
    """
    Inserts a log entry into the database.
    """
    if db_conn._should_skip_system_log_persistence():
        return

    import datetime

    with db_conn._db_init_lock:
        if db_conn._should_skip_system_log_persistence():
            return
        db_conn._system_log_persist_in_progress = True

    try:
        conn = get_db_connection()
        try:
            now = datetime.datetime.now()
            timestamp = now.strftime("%H:%M:%S")

            conn.execute("""
                INSERT INTO system_logs (timestamp, message, level, module, details, correlation_id, user_id, snapshot)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (timestamp, message, level, module, details, correlation_id, user_id, snapshot))
            conn.commit()
        except Exception as e:
            logger.error(f"[Database] Failed to insert system log: {e}")
        finally:
            conn.close()
    finally:
        with db_conn._db_init_lock:
            db_conn._system_log_persist_in_progress = False


def get_system_logs(limit: int = 200, offset: int = 0, level: Optional[str] = None, module: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieves logs with optional filtering.
    """
    conn = get_db_connection()
    try:
        query = "SELECT * FROM system_logs WHERE 1=1"
        params = []

        if level and level != 'ALL':
            query += " AND level = ?"
            params.append(level)
        if module:
            query += " AND module = ?"
            params.append(module)
        if search:
            query += " AND (message LIKE ? OR details LIKE ?)"
            params.append(f"%{search}%")
            params.append(f"%{search}%")

        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        rows = conn.execute(query, tuple(params)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def prune_system_logs(max_entries: Optional[int] = None, max_days: Optional[int] = None) -> int:
    """
    Deletes old logs to prevent database bloating.
    """
    conn = get_db_connection()
    try:
        # Resolve settings from DB if not passed
        if max_entries is None or max_days is None:
            settings = get_platform_settings()
            if max_entries is None:
                max_entries = int(settings.get('log_max_entries', 5000))
            if max_days is None:
                max_days = int(settings.get('log_retention_days', 7))

        # 0 = Unlimited (skip pruning)
        if max_days == 0 and max_entries == 0:
            return 0

        # 1. Prune by date (skip if 0)
        deleted_count = 0
        if max_days > 0:
            cursor = conn.execute(
                "DELETE FROM system_logs WHERE created_at < datetime('now', ?)",
                (f"-{max_days} days",)
            )
            deleted_count = cursor.rowcount

        # 2. Prune by total count (keep newest max_entries) (skip if 0)
        if max_entries > 0:
            row = conn.execute(
                "SELECT id FROM system_logs ORDER BY created_at DESC LIMIT 1 OFFSET ?",
                (max_entries,)
            ).fetchone()

            if row:
                cutoff_id = row['id']
                cursor2 = conn.execute("DELETE FROM system_logs WHERE id <= ?", (cutoff_id,))
                deleted_count += cursor2.rowcount

        conn.commit()
        if deleted_count > 0:
            logger.info(f"[Database] Pruned {deleted_count} old system logs.")
        return deleted_count
    finally:
        conn.close()


def wipe_system_logs() -> None:
    """Wipe all logs from the database."""
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM system_logs")
        conn.commit()
    finally:
        conn.close()
