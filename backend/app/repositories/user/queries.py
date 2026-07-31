"""
backend/app/repositories/user/queries.py
─────────────────────────────────────────────────────────────────────────────
Queries for fetching user records.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional

from database.engine import get_db_connection


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by their email address.
    """
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
        if row:
            res = dict(row)
            # Map database 'password_hash' to expected 'hashed_password' for auth route compatibility
            res['hashed_password'] = res.get('password_hash')
            res['user_id'] = res.get('id')
            return res
        return None
    finally:
        conn.close()


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a user by their unique primary key ID.
    """
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        if row:
            res = dict(row)
            # Map fields for routing handlers compatibility
            res['hashed_password'] = res.get('password_hash')
            res['user_id'] = res.get('id')
            return res
        return None
    finally:
        conn.close()


def get_all_users() -> List[Dict[str, Any]]:
    """
    Get all registered users safely.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT id, email, full_name, avatar_url, creator_role, credits, created_at FROM users ORDER BY created_at DESC').fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
