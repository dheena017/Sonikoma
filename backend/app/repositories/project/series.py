"""
backend/app/repositories/project/series.py
─────────────────────────────────────────────────────────────────────────────
Webtoon Series, Chapters, and AI Studio Multi-Chapter Sessions.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional

from database.engine import get_db_connection
from services.project.asset_service import cleanup_cached_url
from repositories.project.project import _PROJECT_ROOT

logger = logging.getLogger("sonikoma.repositories.project.series")


def get_series(series_id: str) -> Optional[Dict[str, Any]]:
    """Get a series by its ID or slug."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT * FROM series WHERE id = ? OR slug = ?
        """, (series_id, series_id)).fetchone()
        if not row:
            return None
        d = dict(row)
        if isinstance(d.get("character_dna"), str):
            try:
                d["character_dna"] = json.loads(d["character_dna"])
            except Exception:
                d["character_dna"] = []
        return d
    finally:
        conn.close()


def get_series_by_slug(series_slug: str) -> Optional[Dict[str, Any]]:
    """Get a series by its slug."""
    return get_series(series_slug)


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


def create_series(
    series_id: str,
    user_id: str,
    title: str,
    author: str,
    cover_image: Optional[str] = None,
    genre: str = "action_fantasy",
    synopsis: Optional[str] = None,
    medium_type: str = "manhwa",
    image_model: str = "pollinations-flux",
    voice_language: str = "en-US",
    character_dna: Optional[Any] = None,
    total_chapters: int = 1,
    slug: Optional[str] = None,
) -> None:
    """
    Creates a parent Series metadata entity for a specific user with full AI Studio settings.
    """
    conn = get_db_connection()
    try:
        char_dna_str = json.dumps(character_dna if character_dna else [])
        conn.execute("""
            INSERT INTO series (
                id, user_id, title, author, cover_image, genre,
                synopsis, medium_type, image_model, voice_language,
                character_dna, total_chapters, slug
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            series_id, user_id, title, author, cover_image, genre,
            synopsis, medium_type, image_model, voice_language,
            char_dna_str, total_chapters, slug or series_id
        ))
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
        results = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get("character_dna"), str):
                try:
                    d["character_dna"] = json.loads(d["character_dna"])
                except Exception:
                    d["character_dna"] = []
            results.append(d)
        return results
    finally:
        conn.close()


def add_chapter_to_series(
    chapter_id: str,
    series_id: str,
    episode_number: str,
    title: Optional[str] = None,
    synopsis: Optional[str] = None,
    original_url: Optional[str] = None,
    panels_count: int = 0,
    video_url: Optional[str] = None,
    status: str = "pending",
    progress_percent: float = 0.0,
    current_stage_label: str = "Queued",
    job_id: Optional[str] = None,
) -> None:
    """
    Inserts a new Chapter row nested directly under a parent Series.
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO chapters (
                id, series_id, episode_number, title, synopsis,
                original_url, panels_count, video_url, status,
                progress_percent, current_stage_label, job_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            chapter_id, series_id, episode_number, title or episode_number, synopsis,
            original_url, panels_count, video_url, status,
            progress_percent, current_stage_label, job_id
        ))
        conn.commit()
    finally:
        conn.close()


def update_chapter_progress(
    chapter_id: str,
    progress_percent: float,
    current_stage_label: str,
    status: Optional[str] = None,
) -> None:
    """Updates progress percentage and live status label for a chapter."""
    conn = get_db_connection()
    try:
        if status:
            conn.execute("""
                UPDATE chapters
                SET progress_percent = ?, current_stage_label = ?, status = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (progress_percent, current_stage_label, status, chapter_id))
        else:
            conn.execute("""
                UPDATE chapters
                SET progress_percent = ?, current_stage_label = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (progress_percent, current_stage_label, chapter_id))
        conn.commit()
    finally:
        conn.close()


def update_chapter_media(
    chapter_id: str,
    video_url: Optional[str] = None,
    webtoon_strip_urls: Optional[List[str]] = None,
    comic_pages: Optional[List[Dict[str, Any]]] = None,
    panels_count: Optional[int] = None,
    status: str = "ready",
) -> None:
    """Updates output media assets and marks chapter as ready."""
    conn = get_db_connection()
    try:
        updates = ["status = ?", "progress_percent = 100.0", "current_stage_label = 'Ready'"]
        params: List[Any] = [status]

        if video_url is not None:
            updates.append("video_url = ?")
            params.append(video_url)
        if webtoon_strip_urls is not None:
            updates.append("webtoon_strip_urls = ?")
            params.append(json.dumps(webtoon_strip_urls))
        if comic_pages is not None:
            updates.append("comic_pages = ?")
            params.append(json.dumps(comic_pages))
        if panels_count is not None:
            updates.append("panels_count = ?")
            params.append(panels_count)

        params.append(chapter_id)
        query = f"UPDATE chapters SET {', '.join(updates)}, updated_at = datetime('now') WHERE id = ?"
        conn.execute(query, params)
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
        results = []
        for r in rows:
            d = dict(r)
            d["chapter_id"] = d.get("id")
            d["project_id"] = d.get("id")
            if isinstance(d.get("webtoon_strip_urls"), str):
                try:
                    d["webtoon_strip_urls"] = json.loads(d["webtoon_strip_urls"])
                except Exception:
                    d["webtoon_strip_urls"] = []
            if isinstance(d.get("comic_pages"), str):
                try:
                    d["comic_pages"] = json.loads(d["comic_pages"])
                except Exception:
                    d["comic_pages"] = []
            results.append(d)
        return results
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
