"""
backend/app/repositories/project/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public interface for project repository package.
─────────────────────────────────────────────────────────────────────────────
"""

from repositories.project.project import (
    insert_project,
    _parse_audio_settings,
    get_all_projects,
    get_project,
    get_project_by_slug,
    update_project,
    increment_project_tokens,
    update_project_full,
    cleanup_cached_url,
    delete_project,
    get_all_projects_admin,
)
from repositories.project.panels import (
    insert_panels,
    get_panels,
    delete_panels,
    get_panel_original_url,
)
from repositories.project.series import (
    get_series_by_slug,
    delete_series,
    create_series,
    get_series_for_user,
    add_chapter_to_series,
    get_chapters_for_series,
    delete_series_admin,
    update_series_admin,
)
from repositories.project.tokens import (
    insert_token_log,
    get_token_logs,
)

__all__ = [
    "insert_project",
    "_parse_audio_settings",
    "get_all_projects",
    "get_project",
    "get_project_by_slug",
    "get_series_by_slug",
    "update_project",
    "increment_project_tokens",
    "update_project_full",
    "cleanup_cached_url",
    "delete_project",
    "delete_series",
    "insert_panels",
    "get_panels",
    "delete_panels",
    "get_panel_original_url",
    "create_series",
    "get_series_for_user",
    "add_chapter_to_series",
    "get_chapters_for_series",
    "insert_token_log",
    "get_token_logs",
    "get_all_projects_admin",
    "delete_series_admin",
    "update_series_admin",
]
