"""
backend/app/repositories/project/panels.py
─────────────────────────────────────────────────────────────────────────────
Storyboard panel data operations.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional

from database.engine import get_db_connection
from database.utils import unwrap_proxy_url
from features.platform.projects.services.asset_service import cleanup_cached_url


def save_edit_history(edited_url: str, original_url: str, edit_type: str = 'edit') -> None:
    """Persist an edit-history entry for panel image edits."""
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO image_edit_history (edited_url, original_url, edit_type)
            VALUES (?, ?, ?)
        """, (edited_url, original_url, edit_type))
        conn.commit()
    finally:
        conn.close()


def get_edit_history(edited_url: str) -> Optional[Dict[str, Any]]:
    """Retrieve the stored edit history for a given edited URL."""
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM image_edit_history WHERE edited_url = ?', (edited_url,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def insert_panels(project_id: str, panels: List[Dict[str, Any]]) -> None:
    """Insert multiple panels inside a single atomic transaction."""
    conn = get_db_connection()
    try:
        with conn:
            ch_row = conn.execute('SELECT original_url FROM workspace_chapters WHERE id = ? LIMIT 1', (project_id,)).fetchone()
            ch_orig_url = ch_row['original_url'] if ch_row and ch_row['original_url'] else None

            for i, p in enumerate(panels):
                speech_text = (p.get('speech_text') or "")[:1000]
                visual_description = (p.get('visual_description') or "")[:2000]

                img_url = unwrap_proxy_url(p.get('image_url') or "")
                raw_orig = (
                    p.get('original_url')
                    or p.get('original_image_url')
                    or p.get('source_url')
                    or p.get('originalUrl')
                )
                orig_url = unwrap_proxy_url(raw_orig) if raw_orig else None
                if not orig_url and img_url:
                    row_edit = conn.execute(
                        'SELECT original_url FROM image_edit_history WHERE edited_url = ? LIMIT 1',
                        (img_url,)
                    ).fetchone()
                    if row_edit and row_edit['original_url']:
                        orig_url = row_edit['original_url']
                if not orig_url:
                    orig_url = ch_orig_url or img_url

                panel_idx = p.get('panel_index')
                if panel_idx is None:
                    panel_idx = i

                raw_id = p.get('id')
                panel_id = None
                try:
                    if raw_id is not None:
                        panel_id = int(raw_id)
                except (ValueError, TypeError):
                    panel_id = None

                if panel_id is not None and panel_id > 0:
                    conn.execute("""
                        INSERT OR REPLACE INTO image_panels (
                            id, chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                            duration, motion_type, visual_description, narrative, brightness, contrast, saturation,
                            grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                            inpaint_radius, detection_style, audio_url, smart_crop, crop_padding, is_sanitized
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        panel_id,
                        project_id,
                        panel_idx,
                        img_url,
                        orig_url,
                        speech_text,
                        p.get('sfx') or "",
                        p.get('duration'),
                        p.get('motion_type') or "",
                        visual_description or None,
                        p.get('narrative') or None,
                        p.get('brightness'),
                        p.get('contrast'),
                        p.get('saturation'),
                        1 if p.get('grayscale') else 0,
                        p.get('filter_preset'),
                        p.get('bubble_method'),
                        p.get('bubble_sensitivity'),
                        p.get('bubble_dilation'),
                        p.get('inpaint_radius'),
                        p.get('detection_style'),
                        p.get('audio_url'),
                        1 if p.get('smart_crop') else 0,
                        p.get('crop_padding'),
                        1 if p.get('is_sanitized') else 0
                    ))
                else:
                    conn.execute("""
                        INSERT INTO image_panels (
                            chapter_id, panel_index, image_url, original_url, speech_text, sfx,
                            duration, motion_type, visual_description, narrative, brightness, contrast, saturation,
                            grayscale, filter_preset, bubble_method, bubble_sensitivity, bubble_dilation,
                            inpaint_radius, detection_style, audio_url, smart_crop, crop_padding, is_sanitized
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        project_id,
                        panel_idx,
                        img_url,
                        orig_url,
                        speech_text,
                        p.get('sfx') or "",
                        p.get('duration'),
                        p.get('motion_type') or "",
                        visual_description or None,
                        p.get('narrative') or None,
                        p.get('brightness'),
                        p.get('contrast'),
                        p.get('saturation'),
                        1 if p.get('grayscale') else 0,
                        p.get('filter_preset'),
                        p.get('bubble_method'),
                        p.get('bubble_sensitivity'),
                        p.get('bubble_dilation'),
                        p.get('inpaint_radius'),
                        p.get('detection_style'),
                        p.get('audio_url'),
                        1 if p.get('smart_crop') else 0,
                        p.get('crop_padding'),
                        1 if p.get('is_sanitized') else 0
                    ))
    finally:
        conn.close()


def get_panels(project_id: str) -> List[Dict[str, Any]]:
    """Get all panels for a project, ordered by panel_index and id."""
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT * FROM image_panels WHERE chapter_id = ? ORDER BY panel_index ASC, id ASC', (project_id,)).fetchall()
        result = []
        for idx, r in enumerate(rows):
            d = dict(r)
            if d.get("id") is None:
                d["id"] = idx + 1
            if d.get("panel_index") is None:
                d["panel_index"] = idx
            result.append(d)
        return result
    finally:
        conn.close()


def delete_panels(project_id: str) -> None:
    """Delete all panels belonging to a project, removing associated files."""
    conn = get_db_connection()
    try:
        rows = conn.execute('SELECT image_url, audio_url FROM image_panels WHERE chapter_id = ?', (project_id,)).fetchall()
        conn.execute('DELETE FROM image_panels WHERE chapter_id = ?', (project_id,))
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
            'SELECT original_url FROM image_panels WHERE image_url = ? AND original_url IS NOT NULL LIMIT 1',
            (image_url,)
        ).fetchone()
        if row and row['original_url']:
            return row['original_url']
        return None
    except Exception:
        return None
    finally:
        conn.close()
