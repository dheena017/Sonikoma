import os
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.project")

def sync_project_to_supabase(project_id: str, body: Any, current_user_id: str) -> None:
    try:
        from database.supabase import supabase
        if supabase:
            supabase_data = {
                "id": project_id,
                "title": body.title or "Untitled Project",
                "genre": body.genre or "general",
                "episode": body.episode or "",
                "author": body.author or "",
                "cover_image": body.cover_image or "",
                "synopsis": body.synopsis or "",
                "panels": [p.dict(exclude_none=True) for p in body.panels] if body.panels else [],
                "user_id": current_user_id,
                "audio_settings": body.audio_settings,
            }
            supabase.table("projects").upsert(supabase_data).execute()
    except Exception as e:
        logger.error(f"Failed to sync project JSON to Supabase: {e}")

def get_series_details(series_id_or_slug: str, current_user_id: str) -> Optional[Dict[str, Any]]:
    from database.connection import get_db_connection
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM series WHERE id = ?", (series_id_or_slug,)).fetchone()
    if not row:
        row = conn.execute("SELECT * FROM series WHERE slug = ?", (series_id_or_slug,)).fetchone()
    conn.close()
    
    if not row:
        return None
    
    series = dict(row)
    if series.get("user_id") != current_user_id:
        raise PermissionError("Access denied.")
    return series

def delete_temp_file(image_path: Optional[str]) -> None:
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except OSError:
            pass
