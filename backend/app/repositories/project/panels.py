"""
backend/app/repositories/project/panels.py
─────────────────────────────────────────────────────────────────────────────
Storyboard panel data operations.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional

from database.connection import get_db_connection, unwrap_proxy_url
from services.project.asset_service import cleanup_cached_url


def insert_panels(project_id: str, panels: List[Dict[str, Any]]) -> None:
    """Insert multiple panels inside a single atomic transaction."""
    conn = get_db_connection()
    try:
        with conn:
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
                    unwrap_proxy_url(p.get('image_url') or ""),
                    unwrap_proxy_url(p.get('original_image_url') or p.get('original_url', None)),
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
    """Delete all panels belonging to a project, removing associated files."""
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT image_url, audio_url FROM panels WHERE chapter_id = ?', (project_id,)).fetchall()
        conn.execute('DELETE FROM panels WHERE chapter_id = ?', (project_id,))
        conn.commit()
        for r in rows:
            cleanup_cached_url(r['image_url'])
            cleanup_cached_url(r['audio_url'])
    finally:
        conn.close()


def get_panel_original_url(image_url: str) -> Optional[str]:
    """
    Given an image_url (e.g. /api/image/cached/merged_...), return
    the original_url stored in the panels table, or None if not found.
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
