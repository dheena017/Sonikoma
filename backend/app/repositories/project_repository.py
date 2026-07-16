"""
backend/app/repositories/project_repository.py
─────────────────────────────────────────────────────────────────────────────
Project, series, chapters, and panels database repository.
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

logger = logging.getLogger("sonikoma.repositories.project_repository")

def insert_project(data: Dict[str, Any]) -> None:
    """
    Inserts a project by mapping it to the Series/Chapters relational structure.
    """
    conn = get_db_connection()
    try:
        user_id = data.get('user_id') or 'system_default'
        title = data.get('title') or 'Untitled Webtoon'
        user_id = ensure_user_exists(conn, user_id, title)
        genre = data.get('genre') or 'general'
        author = data.get('author') or 'Unknown Author'
        cover_image = unwrap_proxy_url(data.get('cover_image'))
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
        original_url = unwrap_proxy_url(data.get('url'))
        status = data.get('status') or 'pending'
        panels_count = data.get('panels_count') or 0
        video_url = data.get('video_url')

        row_ch = conn.execute("SELECT id, total_tokens_used FROM chapters WHERE id = ? LIMIT 1", (chapter_id,)).fetchone()
        if row_ch:
            # Accumulate tokens if they are passed
            tokens_to_add = data.get('total_tokens_used', 0)
            new_token_total = (row_ch['total_tokens_used'] or 0) + tokens_to_add if tokens_to_add else row_ch['total_tokens_used']

            conn.execute("""
                UPDATE chapters
                SET episode_number = ?, original_url = ?, status = ?, panels_count = ?, video_url = ?, total_tokens_used = ?
                WHERE id = ?
            """, (episode_number, original_url, status, panels_count, video_url, new_token_total, chapter_id))
        else:
            # Generate slug for chapter
            chapter_slug = generate_unique_slug(f"{title} {episode_number}", 'chapters', conn)
            initial_tokens = data.get('total_tokens_used', 0)
            conn.execute("""
                INSERT INTO chapters (id, series_id, episode_number, slug, original_url, status, panels_count, video_url, total_tokens_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (chapter_id, series_id, episode_number, chapter_slug, original_url, status, panels_count, video_url, initial_tokens))
        conn.commit()
    finally:
        conn.close()


def _parse_audio_settings(proj_dict: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not proj_dict:
        return None
    audio_set = proj_dict.get("audio_settings")
    if isinstance(audio_set, str) and audio_set.strip():
        import json
        try:
            proj_dict["audio_settings"] = json.loads(audio_set)
        except Exception:
            proj_dict["audio_settings"] = None
    elif not audio_set:
        proj_dict["audio_settings"] = None
    return proj_dict


def get_all_projects(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all projects ordered by most recent first."""
    conn = get_db_connection()
    try:
        if user_id:
            rows = conn.execute("""
                SELECT c.id AS project_id, c.original_url AS url, s.title, s.genre, s.author, s.cover_image, s.synopsis,
                       c.episode_number AS episode, c.status, c.panels_count, c.video_url,
                       c.created_at, c.updated_at, s.user_id, s.id AS series_id,
                       s.slug AS series_slug, c.slug AS chapter_slug, c.audio_settings
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
                       s.slug AS series_slug, c.slug AS chapter_slug, c.audio_settings
                FROM chapters c
                JOIN series s ON c.series_id = s.id
                ORDER BY c.created_at DESC
            """).fetchall()
        return [_parse_audio_settings(dict(r)) for r in rows]
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
                   s.slug AS series_slug, c.slug AS chapter_slug, c.audio_settings
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.id = ?
        """, (project_id,)).fetchone()
        return _parse_audio_settings(dict(row)) if row else None
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
                   s.slug AS series_slug, c.slug AS chapter_slug, c.audio_settings
            FROM chapters c
            JOIN series s ON c.series_id = s.id
            WHERE c.slug = ?
        """, (chapter_slug,)).fetchone()
        return _parse_audio_settings(dict(row)) if row else None
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
    """Update a project's status, panels_count, video_url, and total_tokens_used."""
    conn = get_db_connection()
    try:
        set_parts = []
        params = []
        for key in ('status', 'panels_count', 'video_url', 'total_tokens_used'):
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


def increment_project_tokens(project_id: str, tokens: int) -> None:
    """Accumulate total_tokens_used for a given project."""
    conn = get_db_connection()
    try:
        conn.execute("""
            UPDATE chapters
            SET total_tokens_used = total_tokens_used + ?,
                updated_at = datetime('now')
            WHERE id = ?
        """, (tokens, project_id))
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
            if 'audio_settings' in updates:
                chapter_set_parts.append("audio_settings = ?")
                import json
                val = updates['audio_settings']
                if isinstance(val, (dict, list)):
                    val = json.dumps(val)
                chapter_params.append(val)

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
                    val = updates[key]
                    if key == 'cover_image':
                        val = unwrap_proxy_url(val)
                    series_set_parts.append(f"{key} = ?")
                    series_params.append(val)

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
                # 4a. Fetch existing panel URLs before deleting
                rows = conn.execute('SELECT image_url, audio_url FROM panels WHERE chapter_id = ?', (project_id,)).fetchall()
                old_urls = set()
                for r in rows:
                    if r['image_url']: old_urls.add(r['image_url'])
                    if r['audio_url']: old_urls.add(r['audio_url'])

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
                            inpaint_radius, detection_style, audio_url, smart_crop, crop_padding, is_sanitized
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                        p.get('detection_style'),
                        p.get('audio_url'),
                        1 if p.get('smart_crop') else 0,
                        p.get('crop_padding'),
                        1 if p.get('is_sanitized') else 0
                    ))

                # Sync panel count
                conn.execute("UPDATE chapters SET panels_count = ?, updated_at = datetime('now') WHERE id = ?", (len(panels), project_id))

                # 4b. Find which old URLs are not in the new list, and clean them up
                new_urls = set()
                for p in panels:
                    if p.get('image_url'): new_urls.add(unwrap_proxy_url(p.get('image_url')))
                    if p.get('audio_url'): new_urls.add(unwrap_proxy_url(p.get('audio_url')))

                deleted_urls = old_urls - new_urls
                for url in deleted_urls:
                    cleanup_cached_url(url)
    finally:
        conn.close()


def cleanup_cached_url(url: Optional[str]) -> None:
    """Extract cache ID from URL and delete the corresponding file from disk cache."""
    if not url:
        return
    import re
    match = re.search(r'/cached/([^/?#\s]+)', url)
    if match:
        cache_id = match.group(1)
        try:
            from utils.cache import stitched_cache
            logger.info(f"[Database] Deleting cached panel asset file from disk: {cache_id}")
            stitched_cache.delete(cache_id)
        except Exception as e:
            logger.error(f"[Database] Failed to delete cache file {cache_id}: {e}")


def delete_project(project_id: str) -> None:
    """Delete a project and all its panels (via SQL CASCADE), removing associated files from cache."""
    conn = get_db_connection()
    try:
        # Fetch all panel URLs and compiled video URL before deleting
        rows = conn.execute('SELECT image_url, audio_url FROM panels WHERE chapter_id = ?', (project_id,)).fetchall()
        panel_urls = []
        for r in rows:
            if r['image_url']: panel_urls.append(r['image_url'])
            if r['audio_url']: panel_urls.append(r['audio_url'])

        chap = conn.execute('SELECT video_url FROM chapters WHERE id = ?', (project_id,)).fetchone()

        conn.execute('DELETE FROM chapters WHERE id = ?', (project_id,))
        conn.commit()

        # Clean up cached panel files
        for url in panel_urls:
            cleanup_cached_url(url)

        # Clean up compiled video file
        if chap and chap['video_url']:
            video_path = os.path.abspath(os.path.join(_PROJECT_ROOT, 'data', 'media', chap['video_url'].split('/')[-1]))
            if os.path.exists(video_path):
                try:
                    logger.info(f"[Database] Deleting project compiled video file from disk: {video_path}")
                    os.remove(video_path)
                except Exception as e:
                    logger.error(f"[Database] Failed to delete video file {video_path}: {e}")
    finally:
        conn.close()


def delete_series(series_id: str) -> None:
    """Delete a series and all its chapters & panels (via SQL CASCADE), removing associated files."""
    conn = get_db_connection()
    try:
        # Fetch all panel URLs and compiled video URLs under this series
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


def insert_token_log(log_id: str, project_id: str, input_tokens: int, output_tokens: int, total_tokens: int, estimated_cost_usd: float) -> None:
    """
    Inserts a new token usage log entry.
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO token_usage_logs (id, project_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (log_id, project_id, input_tokens, output_tokens, total_tokens, estimated_cost_usd))
        conn.commit()
    except Exception as e:
        logger.error(f"Failed to insert token usage log: {e}")
    finally:
        conn.close()


def get_token_logs(user_id: str) -> List[Dict[str, Any]]:
    """
    Retrieves token usage logs for all projects owned by the user.
    """
    conn = get_db_connection()
    try:
        rows = conn.execute("""
            SELECT l.*, p.title
            FROM token_usage_logs l
            JOIN projects p ON l.project_id = p.project_id
            WHERE p.user_id = ?
            ORDER BY l.created_at DESC
        """, (user_id,)).fetchall()
        return [dict(r) for r in rows]
    except Exception:
        try:
            rows = conn.execute("""
                SELECT l.*, c.episode_number, s.title
                FROM token_usage_logs l
                JOIN chapters c ON l.project_id = c.id
                JOIN series s ON c.series_id = s.id
                WHERE s.user_id = ?
                ORDER BY l.created_at DESC
            """, (user_id,)).fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            logger.error(f"Failed to fetch token logs: {e}")
            return []
    finally:
        conn.close()


def get_all_projects_admin() -> list[dict]:
    conn = get_db_connection()
    try:
        # Fetch all series with user email attached
        rows = conn.execute('''
            SELECT s.*, u.email as user_email
            FROM series s
            LEFT JOIN users u ON s.user_id = u.id
            ORDER BY s.created_at DESC
            LIMIT 500
        ''').fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def delete_series_admin(series_id: str):
    conn = get_db_connection()
    try:
        # Cascade delete is enabled in schema
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


