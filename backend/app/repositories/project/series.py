"""
backend/app/repositories/project/series.py
─────────────────────────────────────────────────────────────────────────────
Webtoon Series and nested Episode Chapters.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional

from infrastructure.database.connection import get_db_connection
from repositories.project.project import cleanup_cached_url, _PROJECT_ROOT

logger = logging.getLogger("sonikoma.repositories.project.series")


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


def delete_series(series_id: str) -> None:
    """Delete a series and all its chapters & panels (via SQL CASCADE), removing associated files."""
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT image_url, audio_url
            FROM panels
            WHERE chapter_id IN (SELECT id FROM chapters WHERE series_id = ?)
        """, (series_id,)).fetchall()
        panel_urls = []
        for r in rows:
            if r['image_url']: panel_urls.append(r['image_url'])
            if r['audio_url']: panel_urls.append(r['audio_url'])

        chaps = conn.execute('SELECT video_url FROM chapters WHERE series_id = ?', (series_id,)).fetchall()

        conn.execute('DELETE FROM series WHERE id = ?', (series_id,))
        conn.commit()

        # Clean up cached panel files
        for url in panel_urls:
            cleanup_cached_url(url)

        # Clean up compiled video files
        for c in chaps:
            if c['video_url']:
                video_path = os.path.abspath(os.path.join(_PROJECT_ROOT, 'data', 'media', c['video_url'].split('/')[-1]))
                if os.path.exists(video_path):
                    try:
                        logger.info(f"[Database] Deleting series compiled video file from disk: {video_path}")
                        os.remove(video_path)
                    except Exception as e:
                        logger.error(f"[Database] Failed to delete video file {video_path}: {e}")
    finally:
        conn.close()


def create_series(series_id: str, user_id: str, title: str, author: str, cover_image: Optional[str] = None, genre: str = "general") -> None:
    """
    Creates a parent Series metadata entity for a specific user.
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
    """
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM chapters WHERE series_id = ? ORDER BY created_at ASC", (series_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def delete_series_admin(series_id: str):
    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM series WHERE id = ?', (series_id,))
        conn.commit()
    finally:
        conn.close()


def update_series_admin(series_id: str, updates: dict):
    conn = get_db_connection()
    try:
        set_parts = []
        params = []
        for k, v in updates.items():
            set_parts.append(f"{k} = ?")
            params.append(v)
        params.append(series_id)

        query = f"UPDATE series SET {', '.join(set_parts)} WHERE id = ?"
        conn.execute(query, params)
        conn.commit()
    finally:
        conn.close()
