"""
backend/app/repositories/system/announcements.py
─────────────────────────────────────────────────────────────────────────────
System notifications and announcements data operations.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any

from infrastructure.database.connection import get_db_connection


def get_announcements() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT * FROM system_announcements ORDER BY created_at DESC').fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def create_announcement(title: str, message: str, announcement_type: str = 'info') -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO system_announcements (title, message, type, status) VALUES (?, ?, ?, ?) RETURNING *',
            (title, message, announcement_type, 'active')
        )
        row = cursor.fetchone()
        conn.commit()
        return dict(row) if row else {}
    finally:
        conn.close()


def delete_announcement(announcement_id: int) -> bool:
    conn = get_db_connection()
    try:
        cursor = conn.execute('DELETE FROM system_announcements WHERE id = ?', (announcement_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()
