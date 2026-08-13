"""
Service layer for managing projects and chapters.

This module acts as the core business logic orchestrator for Project entities.
It delegates persistence to the repository layer and ensures no data access logic leaks into the API.
"""

import os
import logging
from typing import Any, Dict, Optional, Protocol, cast

from app.core.config import NODE_ENV
from database.transaction import unwrap_proxy_url

logger = logging.getLogger("sonikoma.services.project")


class ProjectRepositoryProtocol(Protocol):
    def get_project(self, project_id: str) -> Any: ...
    def get_project_by_slug(self, project_id: str) -> Any: ...
    def insert_project(self, project: Any) -> None: ...
    def insert_panels(self, project_id: str, panels: Any) -> None: ...
    def update_project(self, project_id: str, updates: dict[str, Any]) -> None: ...
    def update_project_full(self, project_id: str, updates: dict[str, Any], db_panels: Any) -> None: ...
    def increment_project_tokens(self, project_id: str, tokens: int) -> None: ...


class ProjectService:
    def __init__(self, repo: Optional[ProjectRepositoryProtocol] = None):
        self.repo: ProjectRepositoryProtocol = repo or self._default_repo()

    def _default_repo(self) -> ProjectRepositoryProtocol:
        from repositories.project import (
            get_project,
            get_project_by_slug,
            insert_project,
            insert_panels,
            update_project,
            update_project_full,
            increment_project_tokens,
        )

        return cast(
            ProjectRepositoryProtocol,
            type(
                "_ProjectRepositoryAdapter",
                (),
                {
                    "get_project": staticmethod(get_project),
                    "get_project_by_slug": staticmethod(get_project_by_slug),
                    "insert_project": staticmethod(insert_project),
                    "insert_panels": staticmethod(insert_panels),
                    "update_project": staticmethod(update_project),
                    "update_project_full": staticmethod(update_project_full),
                    "increment_project_tokens": staticmethod(increment_project_tokens),
                },
            )(),
        )

    def _get_panel_field(self, panel: Any, field: str, default: Any = None) -> Any:
        if isinstance(panel, dict):
            return panel.get(field, default)
        return getattr(panel, field, default)

    def create_project(self, body: Any, current_user_id: str) -> Dict[str, Any]:
        existing = self.repo.get_project(body.project_id)
        if existing:
            return {"success": True, "project_id": body.project_id, "message": "Project already exists."}

        self.repo.insert_project(
            {
                "project_id": body.project_id,
                "project_type": getattr(body, "project_type", "permanent") or "permanent",
                "job_id": getattr(body, "job_id", None),
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

    def promote_project(self, project_id: str, current_user_id: str) -> Dict[str, Any]:
        """
        Promote a temporary workspace project to permanent saved status.
        The project_id stays the same — only project_type flips to 'permanent'.
        """
        project = self.repo.get_project(project_id)
        if not project:
            project = self.repo.get_project_by_slug(project_id)
            if project:
                project_id = project["project_id"]

        if not project:
            raise ValueError("Project not found.")

        if project.get("user_id") != current_user_id:
            raise PermissionError("Access denied.")

        if project.get("project_type") == "permanent":
            return {"success": True, "project_id": project_id, "already_permanent": True}

        self.repo.update_project(project_id, {"project_type": "permanent", "status": "ready"})
        return {"success": True, "project_id": project_id, "promoted": True}

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
                "image_url": unwrap_proxy_url(self._get_panel_field(panel, "image_url", "")),
                "speech_text": self._get_panel_field(panel, "speech_text", ""),
                "sfx": self._get_panel_field(panel, "sfx", ""),
                "duration": self._get_panel_field(panel, "duration", 4.5),
                "motion_type": self._get_panel_field(panel, "motion_type", "zoom_in"),
                "visual_description": self._get_panel_field(panel, "visual_description", None),
                "narrative": self._get_panel_field(panel, "narrative", None),
                "brightness": self._get_panel_field(panel, "brightness", None),
                "contrast": self._get_panel_field(panel, "contrast", None),
                "saturation": self._get_panel_field(panel, "saturation", None),
                "grayscale": self._get_panel_field(panel, "grayscale", False),
                "filter_preset": self._get_panel_field(panel, "filter_preset", None),
                "bubble_method": self._get_panel_field(panel, "bubble_method", None),
                "bubble_sensitivity": self._get_panel_field(panel, "bubble_sensitivity", None),
                "bubble_dilation": self._get_panel_field(panel, "bubble_dilation", None),
                "inpaint_radius": self._get_panel_field(panel, "inpaint_radius", None),
                "detection_style": self._get_panel_field(panel, "detection_style", None),
                "original_url": unwrap_proxy_url(self._get_panel_field(panel, "original_image_url", None)),
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
            raise ValueError("Project not found.")

        if project.get("user_id") != current_user_id:
            raise PermissionError("Access denied.")

        # Enforce job boundary: if the stored project has a job_id and the caller
        # provides a different one, reject the update to prevent cross-job data corruption.
        stored_job_id = project.get("job_id")
        incoming_job_id = getattr(body, "job_id", None)
        if stored_job_id and incoming_job_id and stored_job_id != incoming_job_id:
            raise ValueError(
                f"job_id mismatch: project belongs to job '{stored_job_id}', "
                f"cannot update under job '{incoming_job_id}'."
            )

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

        fields_set = getattr(body, "model_fields_set", getattr(body, "__fields_set__", set()))
        if "job_id" in fields_set:
            updates["job_id"] = getattr(body, "job_id", None)
        elif hasattr(body, "job_id") and getattr(body, "job_id") is not None:
            updates["job_id"] = getattr(body, "job_id")

        if body.cover_image is not None:
            updates["cover_image"] = unwrap_proxy_url(body.cover_image)

        db_panels = None
        if body.panels is not None:
            db_panels = []
            for panel in body.panels:
                payload = {
                    "image_url": unwrap_proxy_url(self._get_panel_field(panel, "image_url", "")),
                    "speech_text": self._get_panel_field(panel, "speech_text", ""),
                    "sfx": self._get_panel_field(panel, "sfx", ""),
                    "duration": self._get_panel_field(panel, "duration", 4.5),
                    "motion_type": self._get_panel_field(panel, "motion_type", "zoom_in"),
                    "visual_description": self._get_panel_field(panel, "visual_description", None),
                    "narrative": self._get_panel_field(panel, "narrative", None),
                    "brightness": self._get_panel_field(panel, "brightness", None),
                    "contrast": self._get_panel_field(panel, "contrast", None),
                    "saturation": self._get_panel_field(panel, "saturation", None),
                    "grayscale": self._get_panel_field(panel, "grayscale", False),
                    "filter_preset": self._get_panel_field(panel, "filter_preset", None),
                    "bubble_method": self._get_panel_field(panel, "bubble_method", None),
                    "bubble_sensitivity": self._get_panel_field(panel, "bubble_sensitivity", None),
                    "bubble_dilation": self._get_panel_field(panel, "bubble_dilation", None),
                    "inpaint_radius": self._get_panel_field(panel, "inpaint_radius", None),
                    "detection_style": self._get_panel_field(panel, "detection_style", None),
                    "original_url": unwrap_proxy_url(self._get_panel_field(panel, "original_image_url", None)),
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
        if body is None:
            return

        if NODE_ENV != "production":
            logger.debug(
                f"Supabase sync skipped because NODE_ENV={NODE_ENV}. "
                "Set NODE_ENV=production to enable Supabase sync."
            )
            return

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


def promote_project(project_id: str, current_user_id: str) -> Dict[str, Any]:
    return ProjectService().promote_project(project_id, current_user_id)


def delete_temp_file(image_path: Optional[str]) -> None:
    ProjectService().delete_temp_file(image_path)

