"""
backend/app/repositories/youtube_repository.py
─────────────────────────────────────────────────────────────────────────────
YouTube integration credentials and publishing database repository.
─────────────────────────────────────────────────────────────────────────────
"""

import json
import logging
from typing import List, Dict, Any, Optional

# Import DB connection helpers
from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.repositories.youtube_repository")

def save_youtube_profile(user_id: str, profile: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.execute("""
            INSERT INTO youtube_profiles (
                user_id, name, title_template, description_template, tags,
                category_id, privacy_status, is_short, made_for_kids,
                paid_promotion, license, video_language, channel_link,
                discord_link, patreon_link
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, name) DO UPDATE SET
                title_template=excluded.title_template,
                description_template=excluded.description_template,
                tags=excluded.tags,
                category_id=excluded.category_id,
                privacy_status=excluded.privacy_status,
                is_short=excluded.is_short,
                made_for_kids=excluded.made_for_kids,
                paid_promotion=excluded.paid_promotion,
                license=excluded.license,
                video_language=excluded.video_language,
                channel_link=excluded.channel_link,
                discord_link=excluded.discord_link,
                patreon_link=excluded.patreon_link
            RETURNING *
        """, (
            user_id,
            profile['name'],
            profile['title_template'],
            profile['description_template'],
            json.dumps(profile['tags']),
            profile.get('category_id', '1'),
            profile.get('privacy_status', 'unlisted'),
            1 if profile.get('is_short') else 0,
            profile.get('made_for_kids', 'no'),
            1 if profile.get('paid_promotion') else 0,
            profile.get('license', 'youtube'),
            profile.get('video_language', 'en'),
            profile.get('channel_link', ''),
            profile.get('discord_link', ''),
            profile.get('patreon_link', '')
        ))
        row = cursor.fetchone()
        conn.commit()
        return dict(row) if row else {}
    finally:
        conn.close()


def get_youtube_profiles(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM youtube_profiles WHERE user_id = ? ORDER BY name ASC", (user_id,)).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            try:
                d['tags'] = json.loads(d['tags'])
            except Exception:
                d['tags'] = []
            d['is_short'] = bool(d['is_short'])
            d['paid_promotion'] = bool(d['paid_promotion'])
            result.append(d)
        return result
    finally:
        conn.close()


def delete_youtube_profile(user_id: str, name: str) -> bool:
    conn = get_db_connection()
    try:
        cursor = conn.execute("DELETE FROM youtube_profiles WHERE user_id = ? AND name = ?", (user_id, name))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


def log_youtube_publication(user_id: str, chapter_id: Optional[str], youtube_url: str, title: str, privacy_status: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.execute("""
            INSERT INTO youtube_publications (user_id, chapter_id, youtube_url, title, privacy_status)
            VALUES (?, ?, ?, ?, ?)
            RETURNING *
        """, (user_id, chapter_id, youtube_url, title, privacy_status))
        row = cursor.fetchone()
        conn.commit()
        return dict(row) if row else {}
    finally:
        conn.close()


def get_youtube_publications(user_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM youtube_publications WHERE user_id = ? ORDER BY published_at DESC", (user_id,)).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def save_youtube_credentials(user_id: str, client_id: str, client_secret: str, project_id: str) -> Dict[str, Any]:
    conn = get_db_connection()
    try:
        cursor = conn.execute("""
            INSERT INTO youtube_credentials (user_id, client_id, client_secret, project_id, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                client_id=excluded.client_id,
                client_secret=excluded.client_secret,
                project_id=excluded.project_id,
                updated_at=CURRENT_TIMESTAMP
            RETURNING *
        """, (user_id, client_id, client_secret, project_id))
        row = cursor.fetchone()
        conn.commit()
        return dict(row) if row else {}
    finally:
        conn.close()


def get_youtube_credentials(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM youtube_credentials WHERE user_id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def delete_youtube_credentials(user_id: str) -> bool:
    conn = get_db_connection()
    try:
        cursor = conn.execute("DELETE FROM youtube_credentials WHERE user_id = ?", (user_id,))
        conn.commit()
        return cursor.rowcount > 0
    finally:
        conn.close()


# ── YouTube OAuth Token Store (separate from custom API credentials) ────────

def save_youtube_oauth_tokens(
    user_id: str,
    access_token: str,
    refresh_token: str | None = None,
    client_id: str | None = None,
    client_secret: str | None = None,
    scopes: str | None = None,
) -> None:
    """
    Persist YouTube-specific OAuth access/refresh tokens for a user.
    These are obtained via the dedicated YouTube connect flow (not the Sonikoma login).
    """
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO youtube_oauth_tokens (user_id, access_token, refresh_token, client_id, client_secret, scopes, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
                access_token=excluded.access_token,
                refresh_token=COALESCE(excluded.refresh_token, refresh_token),
                client_id=COALESCE(excluded.client_id, client_id),
                client_secret=COALESCE(excluded.client_secret, client_secret),
                scopes=COALESCE(excluded.scopes, scopes),
                updated_at=datetime('now')
        """, (user_id, access_token, refresh_token, client_id, client_secret, scopes))
        conn.commit()
    finally:
        conn.close()


def get_youtube_oauth_tokens(user_id: str) -> Optional[Dict[str, Any]]:
    """Return the stored YouTube OAuth tokens for a user, or None if not connected."""
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM youtube_oauth_tokens WHERE user_id = ?", (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def save_selected_youtube_channel(
    user_id: str,
    channel_id: str,
    title: str,
    thumbnail: str | None = None,
    handle: str | None = None,
) -> None:
    """Persist the user's selected active YouTube channel."""
    conn = get_db_connection()
    try:
        conn.execute("""
            UPDATE youtube_oauth_tokens
            SET selected_channel_id=?, selected_channel_title=?,
                selected_channel_thumbnail=?, selected_channel_handle=?,
                updated_at=datetime('now')
            WHERE user_id=?
        """, (channel_id, title, thumbnail, handle, user_id))
        conn.commit()
    finally:
        conn.close()


def get_selected_youtube_channel(user_id: str) -> Optional[Dict[str, Any]]:
    """Return the currently selected YouTube channel for a user."""
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT selected_channel_id AS id,
                   selected_channel_title AS title,
                   selected_channel_thumbnail AS thumbnail,
                   selected_channel_handle AS custom_url
            FROM youtube_oauth_tokens
            WHERE user_id=? AND selected_channel_id IS NOT NULL
        """, (user_id,)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()
