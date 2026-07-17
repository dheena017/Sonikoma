"""
backend/app/repositories/user/session.py
─────────────────────────────────────────────────────────────────────────────
User active login sessions and audit logs.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any

from infrastructure.database.connection import get_db_connection


def create_user_session(user_id: str, session_id: str, browser: str, ip: str, location: str) -> None:
    conn = get_db_connection()
    try:
        # Check if there is an existing session for the same user, browser, and IP
        existing = conn.execute("""
            SELECT session_id FROM user_sessions
            WHERE user_id = ? AND browser = ? AND ip = ?
            LIMIT 1
        """, (user_id, browser, ip)).fetchone()

        if existing:
            conn.execute("""
                UPDATE user_sessions
                SET session_id = ?, active = 1, created_at = datetime('now')
                WHERE user_id = ? AND browser = ? AND ip = ?
            """, (session_id, user_id, browser, ip))
        else:
            conn.execute("""
                INSERT INTO user_sessions (session_id, user_id, browser, ip, location, active)
                VALUES (?, ?, ?, ?, ?, 1)
            """, (session_id, user_id, browser, ip, location))

        # Prune active sessions if they exceed 5
        rows = conn.execute("""
            SELECT session_id FROM user_sessions
            WHERE user_id = ? AND active = 1
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        active_sids = [r['session_id'] for r in rows]
        if len(active_sids) > 5:
            to_remove = active_sids[5:]
            for sid in to_remove:
                conn.execute("DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?", (user_id, sid))

        conn.commit()
    finally:
        conn.close()


def get_user_sessions(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        # Automatically deduplicate and prune sessions for same browser & IP keeping the most recent one
        rows = conn.execute("""
            SELECT id, browser, ip, created_at FROM user_sessions
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()

        seen = set()
        to_delete = []
        for r in rows:
            key = (r['browser'], r['ip'])
            if key in seen:
                to_delete.append(r['id'])
            else:
                seen.add(key)

        if to_delete:
            conn.execute(f"DELETE FROM user_sessions WHERE id IN ({','.join(map(str, to_delete))})")
            conn.commit()

        # Enforce maximum 5 active sessions
        active_rows = conn.execute("""
            SELECT session_id FROM user_sessions
            WHERE user_id = ? AND active = 1
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        active_sids = [r['session_id'] for r in active_rows]
        if len(active_sids) > 5:
            excess = active_sids[5:]
            for sid in excess:
                conn.execute("DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?", (user_id, sid))
            conn.commit()

        rows = conn.execute("SELECT * FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def terminate_user_session(user_id: str, session_id: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?", (user_id, session_id))
        conn.commit()
    finally:
        conn.close()


def write_audit_log(user_id: str, event: str, ip: str, status: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO user_audit_logs (user_id, event, ip, status)
            VALUES (?, ?, ?, ?)
        """, (user_id, event, ip, status))
        conn.commit()
    finally:
        conn.close()


def get_audit_logs(user_id: str, query: str = "", limit: int = 10, offset: int = 0) -> tuple[List[Dict[str, Any]], int]:
    conn = get_db_connection()
    try:
        search_pattern = f"%{query}%"

        # Get count
        count_row = conn.execute("""
            SELECT COUNT(*) as c FROM user_audit_logs
            WHERE user_id = ? AND (event LIKE ? OR ip LIKE ?)
        """, (user_id, search_pattern, search_pattern)).fetchone()
        total = count_row['c'] if count_row else 0

        # Get logs
        rows = conn.execute("""
            SELECT * FROM user_audit_logs
            WHERE user_id = ? AND (event LIKE ? OR ip LIKE ?)
            ORDER BY created_at DESC LIMIT ? OFFSET ?
        """, (user_id, search_pattern, search_pattern, limit, offset)).fetchall()

        return [dict(r) for r in rows], total
    finally:
        conn.close()
