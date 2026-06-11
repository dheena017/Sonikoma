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

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode = WAL')
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def init_db() -> None:
    if os.path.exists(DB_PATH):
        return
    print(f"[DB] Opening local SQLite database at: {DB_PATH}")
    os.makedirs(DB_DIR, exist_ok=True)
    conn = get_db_connection()
    try:
        if os.path.exists(SCHEMA_PATH):
            with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
                schema = f.read()
            conn.executescript(schema)
            print("[DB] Schema applied successfully.")
        else:
            print("[DB] Warning: schema.sql not found — skipping schema apply.")
    except Exception as e:
        print(f"[DB] Error applying schema: {e}")
    finally:
        conn.close()
    print("[DB] SQLite database ready [OK]")

# Initialize SQLite database immediately upon import
init_db()

# ─── Query Helpers ────────────────────────────────────────────────────────────

def insert_project(data: Dict[str, Any]) -> None:
    """Insert a new project row."""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO projects (project_id, url, title, genre, episode, status, panels_count, video_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data['project_id'],
            data['url'],
            data.get('title', 'Untitled Webtoon'),
            data.get('genre', 'general'),
            data.get('episode', ''),
            data.get('status', 'pending'),
            data.get('panels_count', 0),
            data.get('video_url', None)
        ))
        conn.commit()
    finally:
        conn.close()

def get_all_projects() -> List[Dict[str, Any]]:
    """Get all projects ordered by most recent first."""
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT * FROM projects ORDER BY created_at DESC').fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def get_project(project_id: str) -> Optional[Dict[str, Any]]:
    """Get a single project by its project_id."""
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM projects WHERE project_id = ?', (project_id,)).fetchone()
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
            query = f"UPDATE projects SET {', '.join(set_parts)} WHERE project_id = ?"
            conn.execute(query, tuple(params))
            conn.commit()
    finally:
        conn.close()

def delete_project(project_id: str) -> None:
    """Delete a project and all its panels (via SQL CASCADE)."""
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM projects WHERE project_id = ?', (project_id,))
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
                        project_id, panel_index, image_url, original_url, speech_text, sfx,
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
                    p.get('duration') or 4.5,
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
        rows = conn.execute('SELECT * FROM panels WHERE project_id = ? ORDER BY panel_index ASC', (project_id,)).fetchall()
        return [dict(r) for r in rows]
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
        projects = conn.execute("SELECT COUNT(*) as c FROM projects").fetchone()['c']
        panels = conn.execute("SELECT COUNT(*) as c FROM panels").fetchone()['c']
        sessions = conn.execute("SELECT COUNT(*) as c FROM scrape_sessions").fetchone()['c']
        return {"projects": projects, "panels": panels, "sessions": sessions}
    finally:
        conn.close()
