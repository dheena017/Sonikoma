"""
backend/app/repositories/user_repository.py
─────────────────────────────────────────────────────────────────────────────
User and credits database repository.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import sqlite3
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

# Import DB connection helpers
from infrastructure.database.connection import (
    get_db_connection, uuid_hex, datetime_now_date, create_slug,
    generate_unique_slug, generate_missing_slugs, unwrap_proxy_url,
    ensure_user_exists, _is_postgres, LOW_BALANCE_THRESHOLD
)

logger = logging.getLogger("sonikoma.repositories.user_repository")

class LowCreditBalanceError(ValueError):
    """Raised when credit balance falls below LOW_BALANCE_THRESHOLD."""
    def __init__(self, message, balance):
        super().__init__(message)
        self.balance = balance


def create_user(data: Dict[str, Any]) -> None:
    """
    Create a new user. Supports compatibility with both user registration and relational models.
    """
    conn = get_db_connection()
    try:
        # Determine columns dynamically for compatibility
        # If user registration routes pass 'user_id', we map it to the database field 'id'
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


def get_available_credits(user_id: str) -> int:
    """
    Return the current credit balance for a user.
    Reads from credit_balance first; falls back to credits for legacy rows
    that pre-date the credit_balance column.
    """
    conn = get_db_connection()
    try:
        row = conn.execute(
            'SELECT credits, credit_balance FROM users WHERE id = ?', (user_id,)
        ).fetchone()
        if row is None:
            return 0
        # credit_balance is authoritative; fall back to credits for old rows
        bal = row['credit_balance'] if row['credit_balance'] is not None else row['credits']
        return bal if bal is not None else 840
    except Exception:
        # Graceful fallback: credit_balance column may not yet exist on older SQLite DBs
        try:
            row = conn.execute('SELECT credits FROM users WHERE id = ?', (user_id,)).fetchone()
            return (row['credits'] if row and row['credits'] is not None else 840)
        except Exception:
            return 0
    finally:
        conn.close()


def record_credit_transaction(user_id: str, amount: int, feature_name: str) -> int:
    """
    Record a credit change (positive = addition, negative = deduction).

    Atomically:
      1. Acquires a write lock on the users row (BEGIN IMMEDIATE for SQLite,
         SELECT … FOR UPDATE for PostgreSQL) to prevent double-spending.
      2. Validates sufficient balance for deductions (admins bypass validation).
      3. Updates both `credits` and `credit_balance` on the users row.
      4. Inserts a ledger row in `credit_transactions` **within the same
         transaction** — if the insert fails the balance update is rolled back
         too, preventing silent audit-trail loss.

    Returns:
        int: The new balance after the transaction.

    Raises:
        ValueError: When a deduction exceeds the current balance (non-admin).
    """
    conn = get_db_connection()
    try:
        # ── Write lock ────────────────────────────────────────────────────────
        if not _is_postgres:
            try:
                conn.execute("BEGIN IMMEDIATE")
            except Exception:
                pass  # already in a transaction

        query = 'SELECT credits, credit_balance, creator_role FROM users WHERE id = ?'
        if _is_postgres:
            query += ' FOR UPDATE'

        row = conn.execute(query, (user_id,)).fetchone()
        if row is None:
            raise ValueError("User not found")

        is_admin = row['creator_role'] == 'admin'

        try:
            current = row['credit_balance'] if row['credit_balance'] is not None else row['credits']
        except Exception:
            current = row['credits']
        current = current if current is not None else 840

        # ── Balance validation ────────────────────────────────────────────────
        if amount < 0 and current < abs(amount) and not is_admin:
            raise ValueError(
                f"Insufficient credits: need {abs(amount)}, have {current}"
            )

        new_balance = current + amount

        # ── Balance update ────────────────────────────────────────────────────
        try:
            conn.execute(
                "UPDATE users SET credits = ?, credit_balance = ?, updated_at = datetime('now') WHERE id = ?",
                (new_balance, new_balance, user_id)
            )
        except Exception:
            # Fallback: credit_balance column may not yet exist on older DBs
            conn.execute(
                "UPDATE users SET credits = ?, updated_at = datetime('now') WHERE id = ?",
                (new_balance, user_id)
            )

        # ── Ledger insert (same atomic boundary as the balance update) ─────────
        # No try/except here: if this INSERT fails the exception propagates to
        # the outer except block which calls conn.rollback(), ensuring the balance
        # update above is also undone.  No credits are ever lost without a trail.
        tx_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO credit_transactions (id, user_id, amount, feature_name) VALUES (?, ?, ?, ?)",
            (tx_id, user_id, amount, feature_name)
        )

        conn.commit()
        logger.debug(
            f"[Credits] user={user_id} amount={amount:+d} "
            f"feature={feature_name} new_balance={new_balance}"
        )
        return new_balance

    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        conn.close()


def check_credits(user_id: str) -> int:
    """Alias for get_available_credits for backward compatibility."""
    return get_available_credits(user_id)


def deduct_credits(user_id: str, amount: int) -> int:
    """
    Atomically deduct credits. Backward-compatible wrapper around
    record_credit_transaction.
    Raises ValueError if the user does not have enough credits.
    Returns the new balance after deduction.
    """
    return record_credit_transaction(user_id, -amount, "deduction")


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


def create_user_session(user_id: str, session_id: str, browser: str, ip: str, location: str) -> None:
    conn = get_db_connection()
    try:
        # 1. Check if there is an existing session for the same user, browser, and IP
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

        # 2. Prune active sessions if they exceed 5
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
        # Automatically deduplicate and prune sessions for same browser & IP
        # keeping the most recent one
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

        # Also enforce maximum 5 active sessions
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
        # Search criteria
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


def get_creator_analytics(user_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        import datetime

        # 1. Videos Completed
        completed_row = conn.execute("""
            SELECT COUNT(*) as c FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,)).fetchone()
        videos_completed = completed_row['c'] if completed_row else 0

        # 2. Render Duration (sum of duration of panels in completed chapters)
        duration_row = conn.execute("""
            SELECT SUM(p.duration) as d FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,)).fetchone()
        total_duration_sec = duration_row['d'] if duration_row and duration_row['d'] is not None else 0

        # 3. Credits Optimized (estimate based on bubble cleaning or edits)
        clean_row = conn.execute("""
            SELECT COUNT(*) as c FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND (p.bubble_method IS NOT NULL OR p.grayscale = 1)
        """, (user_id,)).fetchone()
        bubble_cleans = clean_row['c'] if clean_row else 0

        edit_row = conn.execute("SELECT COUNT(*) as c FROM edit_history").fetchone()
        total_edits = edit_row['c'] if edit_row else 0

        credits_optimized_pct = min(95, max(15, 10 + bubble_cleans * 3 + total_edits * 2))

        # 4. Average Latency (base 1.8s, slightly dynamic depending on total load)
        avg_latency = round(max(0.8, min(3.5, 1.8 + (bubble_cleans * 0.05) - (videos_completed * 0.02))), 1)

        # 5. Output Formats Breakdown (look at chapters / series data or fallback to realistic percentages)
        chapter_rows = conn.execute("""
            SELECT COUNT(*) as c FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
        """, (user_id,)).fetchone()
        total_chaps = chapter_rows['c'] if chapter_rows else 0

        user_row = conn.execute("SELECT preferences FROM users WHERE id = ?", (user_id,)).fetchone()
        pref_str = user_row['preferences'] if user_row else '{}'
        try:
            prefs = json.loads(pref_str)
        except Exception:
            prefs = {}

        curr_ratio = prefs.get('aspectRatio', '9:16')
        if curr_ratio == '16:9':
            aspect_widescreen_count = max(1, total_chaps)
            aspect_vertical_count = 0
        else:
            aspect_vertical_count = max(1, total_chaps)
            aspect_widescreen_count = 0

        total_ratio = aspect_vertical_count + aspect_widescreen_count
        if total_ratio > 0:
            vertical_pct = round((aspect_vertical_count / total_ratio) * 100)
            widescreen_pct = 100 - vertical_pct
        else:
            vertical_pct = 0
            widescreen_pct = 0

                # 6. AI Voices Preference
        voice_pref = prefs.get('voiceActor', 'Matthew')
        voices = {"Matthew": 0, "Rachel": 0, "Marcus": 0}
        if total_chaps > 0 and voice_pref in voices:
            voices[voice_pref] = 100

        # 7. Narration Mode
        narrations = {"Storyteller Badges": 0, "Snappy Subtitles": 0}
        if total_chaps > 0:
            narrations["Storyteller Badges"] = 100

        # 8. Activity feed (real time events sorted desc)
        activities = []

        # Chapter events
        chap_list = conn.execute("""
            SELECT c.id, c.episode_number, s.title, c.status, c.created_at
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
            ORDER BY c.created_at DESC LIMIT 5
        """, (user_id,)).fetchall()
        for chap in chap_list:
            time_str = chap['created_at']
            if chap['status'] == 'completed':
                activities.append({
                    "title": f"Compiled {chap['title']} {chap['episode_number']}",
                    "desc": "Synthesized full MP4 video and dialogue subtitles",
                    "time": time_str
                })
            else:
                activities.append({
                    "title": f"Scraped {chap['title']} {chap['episode_number']}",
                    "desc": "Extracted panel strips and storyboard metadata",
                    "time": time_str
                })

        # Edits
        edit_list = conn.execute("SELECT edit_type, created_at FROM edit_history ORDER BY created_at DESC LIMIT 5").fetchall()
        for edit in edit_list:
            activities.append({
                "title": f"Cleaned panels via {edit['edit_type']}",
                "desc": f"Applied {edit['edit_type']} filter / image enhancement modification",
                "time": edit['created_at']
            })

        # Audit logs
        audit_list = conn.execute("""
            SELECT event, created_at
            FROM user_audit_logs
            WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 5
        """, (user_id,)).fetchall()
        for audit in audit_list:
            activities.append({
                "title": audit['event'],
                "desc": "Triggered by user account activity",
                "time": audit['created_at']
            })

        # Sort activities by time desc
        activities.sort(key=lambda x: x['time'], reverse=True)
        activities = activities[:4] # Take top 4

        # Format times nicely relative to now
        for act in activities:
            try:
                dt = datetime.datetime.strptime(act['time'], "%Y-%m-%d %H:%M:%S")
                diff = datetime.datetime.now() - dt
                if diff.days == 0:
                    hours = diff.seconds // 3600
                    if hours == 0:
                        mins = (diff.seconds % 3600) // 60
                        act['time'] = f"{mins} minutes ago" if mins > 0 else "Just now"
                    else:
                        act['time'] = f"{hours} hours ago"
                elif diff.days == 1:
                    act['time'] = "1 day ago"
                else:
                    act['time'] = f"{diff.days} days ago"
            except Exception:
                act['time'] = act['time'].split(" ")[0]

        if not activities:
            activities = [
                {"title": "System Initialized", "desc": "Creator account profile created successfully", "time": "Just now"}
            ]

        # 9. Heatmap activity (last 12 weeks = 84 days)
        counts_by_date = {}

        def aggregate_counts(query, params=()):
            rows = conn.execute(query, params).fetchall()
            for r in rows:
                counts_by_date[r['date']] = counts_by_date.get(r['date'], 0) + r['count']

        aggregate_counts("""
            SELECT strftime('%Y-%m-%d', c.created_at) as date, COUNT(*) as count
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
            GROUP BY date
        """, (user_id,))

        aggregate_counts("SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count FROM user_audit_logs WHERE user_id = ? GROUP BY date", (user_id,))
        aggregate_counts("SELECT strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count FROM edit_history GROUP BY date")

        today = datetime.datetime.now().date()
        cells = []
        for i in range(84):
            date_val = today - datetime.timedelta(days=(83 - i))
            date_str = date_val.strftime("%Y-%m-%d")
            count = counts_by_date.get(date_str, 0)

            level = 0
            if count > 0 and count <= 2: level = 1
            elif count > 2 and count <= 4: level = 2
            elif count > 4: level = 3

            cells.append({
                "day": date_val.strftime("%a"),
                "date": date_str,
                "count": count,
                "level": level
            })

        weeks = []
        for w in range(12):
            week_cells = cells[w*7 : (w+1)*7]
            weeks.append(week_cells)

        return {
            "videos_completed": videos_completed,
            "total_duration_sec": total_duration_sec,
            "avg_latency": avg_latency,
            "credits_optimized_pct": credits_optimized_pct,
            "formats": {
                "vertical_pct": vertical_pct,
                "widescreen_pct": widescreen_pct
            },
            "voices": voices,
            "narrations": narrations,
            "heatmap": weeks,
            "activities": activities
        }
    finally:
        conn.close()


def get_user_achievements_and_points(user_id: str) -> dict:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()

        # 1. First Scrape: check if user has created at least one series
        cursor.execute("SELECT COUNT(*) FROM series WHERE user_id = ?", (user_id,))
        series_count = cursor.fetchone()[0]
        first_scrape = series_count > 0

        # 2. Gemini Translator: check if there is an audit log for translation
        cursor.execute("""
            SELECT COUNT(*) FROM user_audit_logs
            WHERE user_id = ? AND (event LIKE '%translation%' OR event LIKE '%translate%')
        """, (user_id,))
        translation_count = cursor.fetchone()[0]
        gemini_translator = translation_count > 0

        # 3. Keyframe Director: check if they have saved panels, or have panels in database
        cursor.execute("""
            SELECT COUNT(*) FROM user_audit_logs
            WHERE user_id = ? AND event LIKE '%Saved Storyboard Panels%'
        """, (user_id,))
        saved_panels_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT COUNT(*) FROM panels p
            JOIN chapters c ON p.chapter_id = c.id
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ?
        """, (user_id,))
        panels_count = cursor.fetchone()[0]
        keyframe_director = (saved_panels_count > 0) or (panels_count > 0)

        # 4. Pro Producer: check if they have compiled at least one completed video chapter
        cursor.execute("""
            SELECT COUNT(*) FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE s.user_id = ? AND c.status = 'completed'
        """, (user_id,))
        completed_count = cursor.fetchone()[0]
        pro_producer = completed_count > 0

        # Build unlocked achievements list
        unlocked = []
        if first_scrape:
            unlocked.append("First Scrape")
        if gemini_translator:
            unlocked.append("Gemini Translator")
        if keyframe_director:
            unlocked.append("Keyframe Director")
        if pro_producer:
            unlocked.append("Pro Producer")

        # 5. Calculate achievement points: Base points is 80, each unlocked achievement gives 100
        points = 80 + len(unlocked) * 100

        # Deduct claimed rewards
        cursor.execute("SELECT unlocked_rewards FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        unlocked_rewards_str = row[0] if row else "[]"
        try:
            unlocked_rewards = json.loads(unlocked_rewards_str)
        except Exception:
            unlocked_rewards = []

        for reward in unlocked_rewards:
            if "+100 AI Credits" in reward:
                points -= 150
            elif "Pro Editor Badge" in reward:
                points -= 200

        # clamp points to be non-negative
        points = max(0, points)

        return {
            "unlocked_achievements": unlocked,
            "achievement_points": points
        }
    finally:
        conn.close()


def get_user_invoices(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM user_invoices WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_credit_transactions(user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
    """
    Return up to `limit` credit transactions for user, newest first.
    Each row is enriched with a `balance_after` field representing the
    running account balance immediately after that transaction was applied.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        ).fetchall()
        txs = [dict(r) for r in rows]

        # Compute running balance_after by replaying transactions oldest→newest.
        # current balance is the starting point; we subtract amounts in reverse order.
        current_balance = get_available_credits(user_id)
        # txs is sorted newest→oldest; iterate and build balance_after for each
        for tx in txs:
            tx["balance_after"] = current_balance
            current_balance -= tx["amount"]   # go backwards in time

        return txs
    finally:
        conn.close()


def seed_default_invoices_if_empty(user_id: str) -> None:
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as c FROM user_invoices WHERE user_id = ?", (user_id,))
        count = cursor.fetchone()[0]
        if count == 0:
            suffix = user_id.split('_')[-1] if '_' in user_id else user_id
            invoices = [
                (f"INV-2026-004-{suffix}", 19.00, "Paid", "2026-06-15 14:30:00"),
                (f"INV-2026-003-{suffix}", 19.00, "Paid", "2026-05-15 10:15:00"),
                (f"INV-2026-002-{suffix}", 19.00, "Paid", "2026-04-15 11:20:00")
            ]
            for inv_id, amt, stat, dt in invoices:
                conn.execute("""
                    INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (inv_id, user_id, amt, stat, dt))
            conn.commit()
    finally:
        conn.close()


def create_user_invoice(user_id: str, amount: float, status: str) -> Dict[str, Any]:
    import random
    from datetime import datetime
    conn = get_db_connection()
    try:
        suffix = user_id.split('_')[-1] if '_' in user_id else user_id
        invoice_id = f"INV-2026-{random.randint(100, 999)}-{suffix}"
        created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        conn.execute("""
            INSERT INTO user_invoices (invoice_id, user_id, amount, status, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (invoice_id, user_id, amount, status, created_at))
        conn.commit()
        return {
            "invoice_id": invoice_id,
            "user_id": user_id,
            "amount": amount,
            "status": status,
            "created_at": created_at
        }
    finally:
        conn.close()


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


def create_user_relational(user_id: str, username: str, email: str, password_hash: str, preferences: str = "{}") -> None:
    """
    Inserts a new user record into the SQLite database.

    SQL Query Explanation:
    - INSERT INTO users (id, username, email, password_hash, preferences) VALUES (?, ?, ?, ?, ?)
    - Inserts a single row with user credentials and default preferences.
    - Parameters match ? positional placeholders.
    """
    conn = get_db_connection()
    try:
        # We execute the INSERT query to create a new user profile
        conn.execute("""
            INSERT INTO users (id, username, email, password_hash, preferences)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, username, email, password_hash, preferences))

        # Commit saves the transaction permanently in the database
        conn.commit()
    finally:
        # Always close the connection to prevent resource locks
        conn.close()


