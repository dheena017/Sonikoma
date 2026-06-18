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
        conn.execute("""
            INSERT INTO user_sessions (session_id, user_id, browser, ip, location, active)
            VALUES (?, ?, ?, ?, ?, 1)
        """, (session_id, user_id, browser, ip, location))
        conn.commit()
    finally:
        conn.close()

def get_user_sessions(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
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

def get_user_api_keys(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
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

# ─── Query Helpers ────────────────────────────────────────────────────────────

def insert_project(data: Dict[str, Any]) -> None:
    """
    Inserts a project by mapping it to the Series/Chapters relational structure.
    """
    conn = get_db_connection()
    try:
        # First, check if a Series matching this title and user already exists.
        # If not, create a series.
        user_id = data.get('user_id') or 'system_default'
        title = data.get('title') or 'Untitled Webtoon'
        genre = data.get('genre') or 'general'
        
        # Look up existing series ID
        row = conn.execute("SELECT id FROM series WHERE user_id = ? AND title = ? LIMIT 1", (user_id, title)).fetchone()
        if row:
            series_id = row['id']
        else:
            # Create a new Series
            series_id = f"ser_{uuid_hex()}"
            conn.execute("""
                INSERT INTO series (id, user_id, title, author, cover_image, genre)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (series_id, user_id, title, 'Unknown Author', None, genre))
        
        # Now, insert the Chapter (which represents the flat Project)
        chapter_id = data['project_id']
        episode_number = data.get('episode') or 'Chapter 1'
        original_url = data.get('url')
        status = data.get('status') or 'pending'
        panels_count = data.get('panels_count') or 0
        video_url = data.get('video_url')
        
        conn.execute("""
            INSERT INTO chapters (id, series_id, episode_number, original_url, status, panels_count, video_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (chapter_id, series_id, episode_number, original_url, status, panels_count, video_url))
        conn.commit()
    finally:
        conn.close()

def get_all_projects(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all projects ordered by most recent first."""
    conn = get_db_connection()
    try:
        if user_id:
            rows = conn.execute("""
                SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, 
                       c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                       c.created_at, c.updated_at, s.user_id
                FROM chapters c
                JOIN series s ON c.series_id = s.id
                WHERE s.user_id = ?
                ORDER BY c.created_at DESC
            """, (user_id,)).fetchall()
        else:
            rows = conn.execute("""
                SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, 
                       c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                       c.created_at, c.updated_at, s.user_id
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
            SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, 
                   c.episode_number AS episode, c.status, c.panels_count, c.video_url, 
                   c.created_at, c.updated_at, s.user_id
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.id = ?
        """, (project_id,)).fetchone()
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

def delete_project(project_id: str) -> None:
    """Delete a project and all its panels (via SQL CASCADE)."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM chapters WHERE id = ?', (project_id,))
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
