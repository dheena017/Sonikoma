"""
backend/app/repositories/user/commands.py
─────────────────────────────────────────────────────────────────────────────
Commands for creating, updating, and deleting user records.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any

from database.engine import get_db_connection


def create_user(data: Dict[str, Any]) -> None:
    """
    Create a new user. Supports compatibility with both user registration and relational models.
    """
    conn = get_db_connection()
    try:
        user_uuid = data.get('id') or data.get('user_id')
        username = data.get('username') or data.get('full_name') or user_uuid
        password_hash = data.get('password_hash') or data.get('hashed_password')
        preferences = data.get('preferences') or '{}'

        conn.execute("""
            INSERT INTO users (id, username, email, password_hash, preferences, avatar_url, full_name, google_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_uuid,
            username,
            data['email'],
            password_hash,
            preferences,
            data.get('avatar_url'),
            data.get('full_name'),
            data.get('google_id')
        ))
        conn.commit()
    finally:
        conn.close()


def update_user(user_id: str, updates: Dict[str, Any]) -> None:
    """
    Update user information dynamically in the SQLite database.
    """
    conn = get_db_connection()
    try:
        set_parts = []
        params = []
        allowed_keys = (
            'username', 'email', 'password_hash', 'hashed_password', 'preferences',
            'full_name', 'avatar_url', 'creator_role', 'bio',
            'newsletter', 'language', 'portfolio_links', 'credits', 'last_claimed_date',
            'unlocked_rewards', 'mfa_enabled', 'social_connections'
        )
        for key in allowed_keys:
            if key in updates:
                db_key = key
                if key == 'hashed_password':
                    db_key = 'password_hash'

                set_parts.append(f"{db_key} = ?")
                params.append(updates[key])
        if set_parts:
            set_parts.append("updated_at = datetime('now')")
            params.append(user_id)
            query = f"UPDATE users SET {', '.join(set_parts)} WHERE id = ?"
            conn.execute(query, tuple(params))
            conn.commit()
    finally:
        conn.close()


def delete_user(user_id: str) -> None:
    """
    Permanently delete a user and all of their associated records from the SQLite database.
    """
    conn = get_db_connection()
    try:
        with conn:
            # Delete chapters and panels by finding all series owned by the user
            series_rows = conn.execute("SELECT id FROM series WHERE user_id = ?", (user_id,)).fetchall()
            for s in series_rows:
                series_id = s["id"]
                conn.execute("DELETE FROM panels WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)", (series_id,))
                conn.execute("DELETE FROM chapters WHERE series_id = ?", (series_id,))

            # Delete series
            conn.execute("DELETE FROM series WHERE user_id = ?", (user_id,))

            # Delete secondary data
            conn.execute("DELETE FROM user_sessions WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_api_keys WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_audit_logs WHERE user_id = ?", (user_id,))
            conn.execute("DELETE FROM user_invoices WHERE user_id = ?", (user_id,))

            # Finally, delete the user
            conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    finally:
        conn.close()


def create_user_relational(user_id: str, username: str, email: str, password_hash: str, preferences: str = "{}") -> None:
    """
    Inserts a new user record into the SQLite database.
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO users (id, username, email, password_hash, preferences)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, username, email, password_hash, preferences))
        conn.commit()
    finally:
        conn.close()
