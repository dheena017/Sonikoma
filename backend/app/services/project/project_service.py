import os
import logging
from typing import Dict, Any, Optional

from database.transaction import unwrap_proxy_url

logger = logging.getLogger("sonikoma.services.project")


class ProjectService:
    def __init__(self, repo=None):
        self.repo = repo or self._default_repo()

    def _default_repo(self):
        from repositories.project_repository import (
            get_project,
            get_project_by_slug,
            insert_project,
        )

        return type(
            "_ProjectRepositoryAdapter",
            (),
            {
                "get_project": staticmethod(get_project),
                "get_project_by_slug": staticmethod(get_project_by_slug),
                "insert_project": staticmethod(insert_project),
            },
        )()

    def create_project(self, body: Any, current_user_id: str) -> Dict[str, Any]:
        existing = self.repo.get_project(body.project_id)
        if existing:
            return {"success": True, "project_id": body.project_id, "message": "Project already exists."}

        self.repo.insert_project(
            {
                "project_id": body.project_id,
                "url": unwrap_proxy_url(body.url),
                "title": body.title,
                "genre": body.genre,
                "episode": body.episode,
                "status": "pending",
                "panels_count": body.panels_count,
                "video_url": body.video_url,
                "user_id": current_user_id,
                "author": body.author,
                "cover_image": unwrap_proxy_url(body.cover_image),
                "synopsis": body.synopsis,
            }
        )
        return {"success": True, "project_id": body.project_id}

    def save_project_panels(self, project_id: str, panels: Any, current_user_id: str, audit_logger=None, request_client=None) -> Dict[str, Any]:
        project = self.repo.get_project(project_id)
        if not project:
            project = self.repo.get_project_by_slug(project_id)
            if project:
                project_id = project["project_id"]

        if not project:
            raise ValueError("Project not found.")

        if project.get("user_id") != current_user_id:
            raise PermissionError("Access denied.")

        db_panels = []
        for panel in panels:
            payload = {
                "image_url": unwrap_proxy_url(panel.image_url),
                "speech_text": panel.speech_text,
                "sfx": panel.sfx,
                "duration": panel.duration,
                "motion_type": panel.motion_type,
                "visual_description": panel.visual_description,
                "brightness": panel.brightness,
                "contrast": panel.contrast,
                "saturation": panel.saturation,
                "grayscale": panel.grayscale,
                "filter_preset": panel.filter_preset,
                "bubble_method": panel.bubble_method,
                "bubble_sensitivity": panel.bubble_sensitivity,
                "bubble_dilation": panel.bubble_dilation,
                "inpaint_radius": panel.inpaint_radius,
                "detection_style": panel.detection_style,
                "original_url": unwrap_proxy_url(panel.original_image_url),
            }
            db_panels.append(payload)

        self.repo.insert_panels(project_id, db_panels)
        self.repo.update_project(project_id, {"panels_count": len(panels)})

        if audit_logger and request_client:
            audit_logger(current_user_id, "Saved Storyboard Panels", request_client, "Success")

        return {"success": True, "saved": len(panels)}

    def increment_project_tokens(self, project_id: str, tokens: int, current_user_id: str) -> Dict[str, Any]:
        project = self.repo.get_project(project_id)
        if not project:
            project = self.repo.get_project_by_slug(project_id)
            if project:
                project_id = project["project_id"]

        if not project:
            raise ValueError("Project not found.")

        if project.get("user_id") != current_user_id:
            raise PermissionError("Access denied.")

        self.repo.increment_project_tokens(project_id, tokens)
        return {"success": True, "added": tokens}

    def update_project_details(self, project_id: str, body: Any, current_user_id: str) -> Dict[str, Any]:
        project = self.repo.get_project(project_id)
        if not project:
            project = self.repo.get_project_by_slug(project_id)
            if project:
                project_id = project["project_id"]

        if not project:
            self.repo.insert_project(
                {
                    "project_id": project_id,
                    "url": body.url or "",
                    "title": body.title or "Untitled Project",
                    "genre": body.genre or "general",
                    "episode": body.episode or "",
                    "status": "pending",
                    "panels_count": len(body.panels) if body.panels else 0,
                    "video_url": None,
                    "user_id": current_user_id,
                    "author": body.author or "",
                    "cover_image": unwrap_proxy_url(body.cover_image) if body.cover_image is not None else "",
                    "synopsis": body.synopsis or "",
                }
            )
            project = {"user_id": current_user_id}

        if project.get("user_id") != current_user_id:
            raise PermissionError("Access denied.")

        field_map = {
            "title": body.title,
            "genre": body.genre,
            "episode": body.episode,
            "author": body.author,
            "synopsis": body.synopsis,
            "video_url": body.video_url,
            "status": body.status,
            "audio_settings": body.audio_settings,
        }
        updates = {k: v for k, v in field_map.items() if v is not None}
        if body.cover_image is not None:
            updates["cover_image"] = unwrap_proxy_url(body.cover_image)

        db_panels = None
        if body.panels is not None:
            db_panels = []
            for panel in body.panels:
                payload = {
                    "image_url": unwrap_proxy_url(panel.image_url),
                    "speech_text": panel.speech_text,
                    "sfx": panel.sfx,
                    "duration": panel.duration,
                    "motion_type": panel.motion_type,
                    "visual_description": panel.visual_description,
                    "brightness": panel.brightness,
                    "contrast": panel.contrast,
                    "saturation": panel.saturation,
                    "grayscale": panel.grayscale,
                    "filter_preset": panel.filter_preset,
                    "bubble_method": panel.bubble_method,
                    "bubble_sensitivity": panel.bubble_sensitivity,
                    "bubble_dilation": panel.bubble_dilation,
                    "inpaint_radius": panel.inpaint_radius,
                    "detection_style": panel.detection_style,
                    "original_url": unwrap_proxy_url(panel.original_image_url),
                }
                db_panels.append(payload)

        self.repo.update_project_full(project_id, updates, db_panels)
        updated_project = self.repo.get_project(project_id)
        return {
            "success": True,
            "series_slug": updated_project.get("series_slug") if updated_project else None,
            "chapter_slug": updated_project.get("chapter_slug") if updated_project else None,
        }

    def sync_project_to_supabase(self, project_id: str, body: Any, current_user_id: str) -> None:
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

    def calculate_and_save_token_usage(self, project_id: str, panels: Any, price_per_million: float = 0.50) -> Dict[str, Any]:
        input_tokens = sum(panel.get("inputTokens", 0) for panel in panels)
        output_tokens = sum(panel.get("outputTokens", 0) for panel in panels)
        total_tokens = input_tokens + output_tokens
        cost = round((total_tokens / 1_000_000.0) * price_per_million, 6)

        usage_metrics = {
            "inputTokens": input_tokens,
            "outputTokens": output_tokens,
            "totalTokens": total_tokens,
            "estimatedCostUSD": cost,
        }

        try:
            self.sync_project_to_supabase(project_id, None, "")
        except Exception as e:
            logger.error(f"Failed to save token usage metrics to Supabase: {e}")

        return usage_metrics

    def get_series_details(self, series_id_or_slug: str, current_user_id: str) -> Optional[Dict[str, Any]]:
        from database.engine import get_db_connection
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

    def delete_temp_file(self, image_path: Optional[str]) -> None:
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except OSError:
                pass


def sync_project_to_supabase(project_id: str, body: Any, current_user_id: str) -> None:
    ProjectService().sync_project_to_supabase(project_id, body, current_user_id)


def get_series_details(series_id_or_slug: str, current_user_id: str) -> Optional[Dict[str, Any]]:
    return ProjectService().get_series_details(series_id_or_slug, current_user_id)


def delete_temp_file(image_path: Optional[str]) -> None:
    ProjectService().delete_temp_file(image_path)
