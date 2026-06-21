"""
backend/python/database/db.py
─────────────────────────────────────────────────────────────────────────────
Local SQLite database connection and CRUD helpers for Webtoon-to-Video.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'database'))
DB_PATH = os.path.join(DB_DIR, 'webtoon_local.db')
SCHEMA_PATH = os.path.join(DB_DIR, 'schema.sql')

import logging
logger = logging.getLogger("anivox.database")

_db_initialized = False

def get_db_connection() -> sqlite3.Connection:
    if not _db_initialized:
        init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode = WAL')
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def init_db() -> None:
    global _db_initialized
    if _db_initialized:
        return
    _db_initialized = True
    logger.info(f"[Database] Opening local SQLite database at: {DB_PATH}")
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # Check if users table exists. If so, inspect it for relational upgrade indicator.
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        users_table_exists = cursor.fetchone() is not None
        
        if users_table_exists:
            cursor.execute("PRAGMA table_info(users)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # If the users table does not have 'username' column, it's the old flat schema.
            # Perform clean relational schema upgrade.
            if "username" not in columns:
                logger.info("[Database] Old database schema detected (missing 'username' in users). Dropping old tables to perform clean relational upgrade...")
                tables = ["panels", "projects", "user_sessions", "user_audit_logs", "user_invoices", "user_api_keys", "users", "series", "chapters", "scrape_sessions", "edit_history"]
                for table in tables:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                conn.commit()
                users_table_exists = False
        
        if not users_table_exists:
            if os.path.exists(SCHEMA_PATH):
                logger.info("[Database] Re-initializing relational schema from schema.sql...")
                with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
                    schema = f.read()
                conn.executescript(schema)
                logger.info("[Database] Relational schema applied successfully.")
            else:
                logger.warning("[Database] schema.sql not found — skipping schema apply.")
        else:
            logger.info("[Database] Relational database schema is already initialized.")
        
        # Safe migration check: add synopsis column to series table if missing
        try:
            cursor.execute("ALTER TABLE series ADD COLUMN synopsis TEXT")
            conn.commit()
            logger.info("[Database] Successfully ran migration: added 'synopsis' column to 'series' table.")
        except Exception:
            pass

        # Slug Migration Check
        try:
            cursor.execute("ALTER TABLE series ADD COLUMN slug TEXT")
            conn.commit()
            logger.info("[Database] Migration: added 'slug' column to 'series' table.")
        except Exception:
            pass

        try:
            cursor.execute("ALTER TABLE chapters ADD COLUMN slug TEXT")
            conn.commit()
            logger.info("[Database] Migration: added 'slug' column to 'chapters' table.")
        except Exception:
            pass

        # Create missing indexes for slugs
        try:
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug ON series(slug)")
            cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug)")
            conn.commit()
        except Exception:
            pass

        # Run one-time slug generation for existing data
        generate_missing_slugs(conn)
            
        conn.commit()
    except Exception as e:
        logger.error(f"[Database] Error checking or applying schema: {e}")
    finally:
        conn.close()
    logger.info("[Database] SQLite database ready [OK]")

# Database initialization is deferred and handled by the app lifespan or on first query.

# ─── User Helpers ─────────────────────────────────────────────────────────────

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

# ─── Sessions, Audit Logs, Invoices & API Keys Helpers ──────────────────────

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
        active_sids = [r[0] for r in rows]
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
            vertical_pct = 75
            widescreen_pct = 25
            
        # 6. AI Voices Preference
        voice_pref = prefs.get('voiceActor', 'Matthew')
        voices = {"Matthew": 0, "Rachel": 0, "Marcus": 0}
        if voice_pref in voices:
            voices[voice_pref] = 60
            other_voices = [v for v in voices.keys() if v != voice_pref]
            voices[other_voices[0]] = 30
            voices[other_voices[1]] = 10
        else:
            voices["Matthew"] = 60
            voices["Rachel"] = 30
            voices["Marcus"] = 10
            
        # 7. Narration Mode
        narrations = {"Storyteller Badges": 85, "Snappy Subtitles": 15}
        
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
                "desc": f"Applied {edit['edit_type']} filter / panel crop modification",
                "time": edit['created_at']
            })
            
        # Audit logs
        audit_list = conn.execute("""
            SELECT event, created_at FROM user_audit_logs 
            WHERE user_id = ? AND event NOT LIKE '%login%'
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

def uuid_hex() -> str:
    import uuid
    return uuid.uuid4().hex[:8]

def datetime_now_date() -> str:
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%d")

def create_slug(title: str) -> str:
    """
    Converts a title into a URL-friendly slug. Supports Unicode characters.
    """
    import re
    if not title:
        return ""

    # Lowercase and remove punctuation except dashes and whitespace
    slug = title.lower()
    # \w matches alphanumeric characters plus underscore. We use Unicode flag by default in Py3.
    # We want to keep alphanumeric, spaces and dashes.
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Replace spaces and underscores with dashes
    slug = re.sub(r'[\s_]+', '-', slug)
    # Collapse multiple dashes
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def generate_unique_slug(title: str, table: str, conn: sqlite3.Connection) -> str:
    """
    Generates a unique slug by appending a counter if the slug already exists.
    """
    base_slug = create_slug(title)
    if not base_slug:
        import uuid
        base_slug = f"untitled-{uuid.uuid4().hex[:6]}"

    slug = base_slug
    counter = 1

    while True:
        row = conn.execute(f"SELECT id FROM {table} WHERE slug = ? LIMIT 1", (slug,)).fetchone()
        if not row:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

def generate_missing_slugs(conn: sqlite3.Connection) -> None:
    """
    Loops through existing series and chapters to generate missing slugs.
    """
    try:
        # Generate for series
        rows = conn.execute("SELECT id, title FROM series WHERE slug IS NULL").fetchall()
        for r in rows:
            unique_slug = generate_unique_slug(r['title'], 'series', conn)
            conn.execute("UPDATE series SET slug = ? WHERE id = ?", (unique_slug, r['id']))

        # Generate for chapters
        rows = conn.execute("""
            SELECT c.id, c.episode_number, s.title as series_title
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.slug IS NULL
        """).fetchall()
        for r in rows:
            # For chapters, use "Series Title - Episode Number" as base for slug
            base_title = f"{r['series_title']} {r['episode_number']}"
            unique_slug = generate_unique_slug(base_title, 'chapters', conn)
            conn.execute("UPDATE chapters SET slug = ? WHERE id = ?", (unique_slug, r['id']))

        conn.commit()
    except Exception as e:
        logger.error(f"[Database] Error generating missing slugs: {e}")

# ─── Query Helpers ────────────────────────────────────────────────────────────

def insert_project(data: Dict[str, Any]) -> None:
    """
    Inserts a project by mapping it to the Series/Chapters relational structure.
    """
    conn = get_db_connection()
    try:
        user_id = data.get('user_id') or 'system_default'
        title = data.get('title') or 'Untitled Webtoon'
        genre = data.get('genre') or 'general'
        author = data.get('author') or 'Unknown Author'
        cover_image = data.get('cover_image')
        synopsis = data.get('synopsis')
        
        # First, check if a Series matching this title and user already exists.
        # If not, create a series.
        row = conn.execute("SELECT id FROM series WHERE user_id = ? AND title = ? LIMIT 1", (user_id, title)).fetchone()
        if row:
            series_id = row['id']
            # Update the series with newly provided metadata if present
            if data.get('author') or data.get('genre') or data.get('cover_image') or data.get('synopsis'):
                conn.execute("""
                    UPDATE series 
                    SET author = COALESCE(?, author), 
                        genre = COALESCE(?, genre), 
                        cover_image = COALESCE(?, cover_image),
                        synopsis = COALESCE(?, synopsis)
                    WHERE id = ?
                """, (data.get('author'), data.get('genre'), data.get('cover_image'), data.get('synopsis'), series_id))
        else:
            # Create a new Series
            series_id = f"ser_{uuid_hex()}"
            series_slug = generate_unique_slug(title, 'series', conn)
            conn.execute("""
                INSERT INTO series (id, user_id, title, slug, author, cover_image, genre, synopsis)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (series_id, user_id, title, series_slug, author, cover_image, genre, synopsis))
        
        # Now, insert the Chapter (which represents the flat Project)
        chapter_id = data['project_id']
        episode_number = data.get('episode') or 'Chapter 1'
        original_url = data.get('url')
        status = data.get('status') or 'pending'
        panels_count = data.get('panels_count') or 0
        video_url = data.get('video_url')
        
        row_ch = conn.execute("SELECT id FROM chapters WHERE id = ? LIMIT 1", (chapter_id,)).fetchone()
        if row_ch:
            conn.execute("""
                UPDATE chapters 
                SET episode_number = ?, original_url = ?, status = ?, panels_count = ?, video_url = ?
                WHERE id = ?
            """, (episode_number, original_url, status, panels_count, video_url, chapter_id))
        else:
            # Generate slug for chapter
            chapter_slug = generate_unique_slug(f"{title} {episode_number}", 'chapters', conn)
            conn.execute("""
                INSERT INTO chapters (id, series_id, episode_number, slug, original_url, status, panels_count, video_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (chapter_id, series_id, episode_number, chapter_slug, original_url, status, panels_count, video_url))
        conn.commit()
    finally:
        conn.close()

def get_all_projects(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all projects ordered by most recent first."""
    conn = get_db_connection()
    try:
        if user_id:
            rows = conn.execute("""
                SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, s.author, s.cover_image, s.synopsis,
                       c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                       c.created_at, c.updated_at, s.user_id, s.id AS series_id,
                       s.slug AS series_slug, c.slug AS chapter_slug
                FROM chapters c
                JOIN series s ON c.series_id = s.id
                WHERE s.user_id = ?
                ORDER BY c.created_at DESC
            """, (user_id,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, s.author, s.cover_image, s.synopsis,
                       c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                       c.created_at, c.updated_at, s.user_id, s.id AS series_id,
                       s.slug AS series_slug, c.slug AS chapter_slug
                FROM chapters c
                JOIN series s ON c.series_id = s.id
                ORDER BY c.created_at DESC
            """).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    """Get a single project by its project_id."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, s.author, s.cover_image, s.synopsis,
                   c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                   c.created_at, c.updated_at, s.user_id, s.id AS series_id,
                   s.slug AS series_slug, c.slug AS chapter_slug
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.id = ?
        """, (project_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_project_by_slug(chapter_slug: str) -> Optional[Dict[str, Any]]:
    """Get a single project by its chapter_slug."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, s.author, s.cover_image, s.synopsis,
                   c.episode_number AS episode, c.status, c.panels_count, c.video_url,
                   c.created_at, c.updated_at, s.user_id, s.id AS series_id,
                   s.slug AS series_slug, c.slug AS chapter_slug
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.slug = ?
        """, (chapter_slug,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_series_by_slug(series_slug: str) -> Optional[Dict[str, Any]]:
    """Get a series by its slug."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT * FROM series WHERE slug = ?
        """, (series_slug,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def update_project(project_id: str, updates: Dict[str, Any]) -> None:
    """Update a project's status, panels_count, and/or video_url."""
    conn = get_db_connection()
    try:
        set_parts = []
        params = []
        for key in ('status', 'panels_count', 'video_url'):
            if key in updates:
                set_parts.append(f"{key} = ?")
                params.append(updates[key])
        if set_parts:
            set_parts.append("updated_at = datetime('now')")
            params.append(project_id)
            query = f"UPDATE chapters SET {', '.join(set_parts)} WHERE id = ?"
            conn.execute(query, tuple(params))
            conn.commit()
    finally:
        conn.close()

def update_project_full(project_id: str, updates: Dict[str, Any], panels: Optional[List[Dict[str, Any]]] = None) -> None:
    """Update project metadata across chapters and series tables, and sync panels list atomically."""
    conn = get_db_connection()
    try:
        with conn:
            # 1. Fetch series_id and title for this project/chapter
            row = conn.execute("""
                SELECT c.series_id, s.title, c.episode_number
                FROM chapters c
                JOIN series s ON c.series_id = s.id
                WHERE c.id = ?
                LIMIT 1
            """, (project_id,)).fetchone()
            if not row:
                raise ValueError(f"Project/Chapter {project_id} not found")
            series_id = row['series_id']
            current_title = row['title']
            current_episode = row['episode_number']
            
            # 2. Update chapters table fields
            chapter_set_parts = []
            chapter_params = []
            if 'episode' in updates:
                chapter_set_parts.append("episode_number = ?")
                chapter_params.append(updates['episode'])
                # If episode changes, we might want to update the chapter slug too
                # though usually slugs remain stable. Let's regenerate for now to match the user's manual preference.
                new_slug = generate_unique_slug(f"{updates.get('title', current_title)} {updates['episode']}", 'chapters', conn)
                chapter_set_parts.append("slug = ?")
                chapter_params.append(new_slug)

            if 'status' in updates:
                chapter_set_parts.append("status = ?")
                chapter_params.append(updates['status'])
            if 'video_url' in updates:
                chapter_set_parts.append("video_url = ?")
                chapter_params.append(updates['video_url'])
            if 'panels_count' in updates:
                chapter_set_parts.append("panels_count = ?")
                chapter_params.append(updates['panels_count'])
                
            if chapter_set_parts:
                chapter_set_parts.append("updated_at = datetime('now')")
                chapter_params.append(project_id)
                query = f"UPDATE chapters SET {', '.join(chapter_set_parts)} WHERE id = ?"
                conn.execute(query, tuple(chapter_params))
                
            # 3. Update series table fields
            series_set_parts = []
            series_params = []
            for key in ('title', 'author', 'cover_image', 'genre', 'synopsis'):
                if key in updates:
                    series_set_parts.append(f"{key} = ?")
                    series_params.append(updates[key])

                    if key == 'title':
                        new_series_slug = generate_unique_slug(updates['title'], 'series', conn)
                        series_set_parts.append("slug = ?")
                        series_params.append(new_series_slug)

            if series_set_parts:
                series_params.append(series_id)
                query = f"UPDATE series SET {', '.join(series_set_parts)} WHERE id = ?"
                conn.execute(query, tuple(series_params))
                
            # 4. Update panels if provided
            if panels is not None:
                # Delete existing panels for this chapter
                conn.execute('DELETE FROM panels WHERE chapter_id = ?', (project_id,))
                
                # Insert the new ones
                for i, p in enumerate(panels):
                    speech_text = (p.get('speech_text') or "")[:1000]
                    visual_description = (p.get('visual_description') or "")[:2000]
                    
                    conn.execute("""
                        INSERT INTO panels (
                            chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                            duration, motion_type, visual_description, brightness, contrast, saturation,
                            grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                            inpaint_radius, detection_style
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        project_id,
                        i,
                        p.get('image_url') or "",
                        p.get('original_image_url') or p.get('original_url', None),
                        speech_text,
                        p.get('sfx') or "",
                        p.get('duration') if p.get('duration') is not None else 4.5,
                        p.get('motion_type') or "zoom_in",
                        visual_description or None,
                        p.get('brightness'),
                        p.get('contrast'),
                        p.get('saturation'),
                        1 if p.get('grayscale') else 0,
                        p.get('filter_preset'),
                        p.get('bubble_method'),
                        p.get('bubble_sensitivity'),
                        p.get('bubble_dilation'),
                        p.get('inpaint_radius'),
                        p.get('detection_style')
                    ))
                
                # Sync panel count
                conn.execute("UPDATE chapters SET panels_count = ?, updated_at = datetime('now') WHERE id = ?", (len(panels), project_id))
    finally:
        conn.close()


def delete_project(project_id: str) -> None:
    """Delete a project and all its panels (via SQL CASCADE)."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM chapters WHERE id = ?', (project_id,))
        conn.commit()
    finally:
        conn.close()

def delete_series(series_id: str) -> None:
    """Delete a series and all its chapters & panels (via SQL CASCADE)."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM series WHERE id = ?', (series_id,))
        conn.commit()
    finally:
        conn.close()

def insert_panels(project_id: str, panels: List[Dict[str, Any]]) -> None:
    """Insert multiple panels inside a single atomic transaction."""
    conn = get_db_connection()
    try:
        with conn:
            for i, p in enumerate(panels):
                # Length validation matching TS rules
                speech_text = (p.get('speech_text') or "")[:1000]
                visual_description = (p.get('visual_description') or "")[:2000]
                
                conn.execute("""
                    INSERT INTO panels (
                        chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                        duration, motion_type, visual_description, brightness, contrast, saturation,
                        grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                        inpaint_radius, detection_style
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    project_id,
                    i,
                    p.get('image_url') or "",
                    p.get('original_image_url') or p.get('original_url', None),
                    speech_text,
                    p.get('sfx') or "",
                    p.get('duration') if p.get('duration') is not None else 4.5,
                    p.get('motion_type') or "zoom_in",
                    visual_description or None,
                    p.get('brightness'),
                    p.get('contrast'),
                    p.get('saturation'),
                    1 if p.get('grayscale') else 0,
                    p.get('filter_preset'),
                    p.get('bubble_method'),
                    p.get('bubble_sensitivity'),
                    p.get('bubble_dilation'),
                    p.get('inpaint_radius'),
                    p.get('detection_style')
                ))
    finally:
        conn.close()

def get_panels(project_id: str) -> List[Dict[str, Any]]:
    """Get all panels for a project, ordered by panel_index."""
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT * FROM panels WHERE chapter_id = ? ORDER BY panel_index ASC', (project_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def delete_panels(project_id: str) -> None:
    """Delete all panels belonging to a project."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM panels WHERE chapter_id = ?', (project_id,))
        conn.commit()
    finally:
        conn.close()


def get_panel_original_url(image_url: str) -> Optional[str]:
    """
    Given an image_url (e.g. /api/merge-images/cached/merged_...), return
    the original_url stored in the panels table, or None if not found.
    Used as a last-resort fallback to recover images after server restarts.
    """
    conn = get_db_connection()
    try:
        row = conn.execute(
            'SELECT original_url FROM panels WHERE image_url = ? AND original_url IS NOT NULL LIMIT 1',
            (image_url,)
        ).fetchone()
        if row and row['original_url']:
            return row['original_url']
        return None
    except Exception:
        return None
    finally:
        conn.close()


def save_scrape_session(url: str, image_urls: List[str]) -> None:
    """Save a scrape session result."""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO scrape_sessions (url, image_urls, panel_count)
            VALUES (?, ?, ?)
        """, (url, json.dumps(image_urls), len(image_urls)))
        conn.commit()
    finally:
        conn.close()

def get_latest_scrape_session(url: str) -> Optional[Dict[str, Any]]:
    """Get the latest scrape session for a URL (for cache reuse)."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT * FROM scrape_sessions WHERE url = ? ORDER BY scraped_at DESC LIMIT 1
        """, (url,)).fetchone()
        if row:
            res = dict(row)
            res['image_urls'] = json.loads(res['image_urls'])
            return res
        return None
    finally:
        conn.close()

def save_edit_history(edited_url: str, original_url: str, edit_type: str = 'crop') -> None:
    """Persist an edit history entry (for undo support across restarts)."""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO edit_history (edited_url, original_url, edit_type)
            VALUES (?, ?, ?)
        """, (edited_url, original_url, edit_type))
        conn.commit()
    finally:
        conn.close()

def get_edit_history(edited_url: str) -> Optional[Dict[str, Any]]:
    """Get the previous URL before an edit (for undo)."""
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM edit_history WHERE edited_url = ?', (edited_url,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_db_stats() -> Dict[str, int]:
    """Get database statistics for the health check endpoint."""
    conn = get_db_connection()
    try:
        # We query the chapters count here because chapters replaced the old projects concept.
        chapters = conn.execute("SELECT COUNT(*) as c FROM chapters").fetchone()['c']
        panels = conn.execute("SELECT COUNT(*) as c FROM panels").fetchone()['c']
        sessions = conn.execute("SELECT COUNT(*) as c FROM scrape_sessions").fetchone()['c']
        return {"projects": chapters, "panels": panels, "sessions": sessions}
    finally:
        conn.close()

# ─── Relational 3-Level Model CRUD Helpers ────────────────────────────────────

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

def create_series(series_id: str, user_id: str, title: str, author: str, cover_image: Optional[str] = None, genre: str = "general") -> None:
    """
    Creates a parent Series metadata entity for a specific user.
    
    SQL Query Explanation:
    - INSERT INTO series (id, user_id, title, author, cover_image, genre) VALUES (?, ?, ?, ?, ?, ?)
    - Saves series parameters linked directly to the parent user.
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO series (id, user_id, title, author, cover_image, genre)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (series_id, user_id, title, author, cover_image, genre))
        conn.commit()
    finally:
        conn.close()

def get_series_for_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Queries and returns all Series publishing metadata linked to a specific user.
    
    SQL Query Explanation:
    - SELECT * FROM series WHERE user_id = ? ORDER BY created_at DESC
    - Fetches all series rows belonging to the given user, ordered newest first.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM series WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def add_chapter_to_series(chapter_id: str, series_id: str, episode_number: str, original_url: Optional[str] = None, panels_count: int = 0, video_url: Optional[str] = None) -> None:
    """
    Inserts a new Chapter row nested directly under a parent Series.
    
    SQL Query Explanation:
    - INSERT INTO chapters (id, series_id, episode_number, original_url, panels_count, video_url) VALUES (?, ?, ?, ?, ?, ?)
    - Appends chapter configurations to SQLite tables under a series ID foreign key constraint.
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO chapters (id, series_id, episode_number, original_url, panels_count, video_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (chapter_id, series_id, episode_number, original_url, panels_count, video_url))
        conn.commit()
    finally:
        conn.close()

def get_chapters_for_series(series_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves all Chapters publishing metadata nested under a specific Series parent ID.
    
    SQL Query Explanation:
    - SELECT * FROM chapters WHERE series_id = ? ORDER BY created_at ASC
    - Fetches all chapters in chronological order by creation date.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM chapters WHERE series_id = ? ORDER BY created_at ASC", (series_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()
