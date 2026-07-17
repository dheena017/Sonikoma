"""
backend/app/repositories/user/api_keys.py
─────────────────────────────────────────────────────────────────────────────
User API keys / developer credentials.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional

from database.connection import get_db_connection, uuid_hex, datetime_now_date


def get_user_api_keys(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            k = d.get("api_key", "")
            if k and len(k) > 16:
                d["api_key"] = f"{k[:12]}...{k[-4:]}"
            result.append(d)
        return result
    finally:
        conn.close()


def get_user_by_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT u.* FROM users u
            JOIN user_api_keys k ON u.id = k.user_id
            WHERE k.api_key = ?
        """, (api_key,)).fetchone()
        if row:
            res = dict(row)
            res['hashed_password'] = res.get('password_hash')
            res['user_id'] = res.get('id')
            return res
        return None
    finally:
        conn.close()


def create_user_api_key(user_id: str, name: str, api_key: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        key_id = f"key_{uuid_hex()}"
        conn.execute("""
            INSERT INTO user_api_keys (key_id, user_id, name, api_key)
            VALUES (?, ?, ?, ?)
        """, (key_id, user_id, name, api_key))
        conn.commit()
        return {"id": key_id, "name": name, "key": api_key, "created": datetime_now_date()}
    finally:
        conn.close()


def delete_user_api_key(user_id: str, key_id: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM user_api_keys WHERE user_id = ? AND key_id = ?", (user_id, key_id))
        conn.commit()
    finally:
        conn.close()
