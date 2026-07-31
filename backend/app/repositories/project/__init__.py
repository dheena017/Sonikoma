"""Project repository package.

Domain wrapper functions are defined at the bottom of this file.
"""
# Import functions directly from their modules when needed

from typing import List, Optional
from domain.project import Panel, Project, Series, TokenLog
from .project import (
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
from .series import (
    get_series_by_slug,
    delete_series,
    create_series,
    get_series_for_user,
    add_chapter_to_series,
    get_chapters_for_series,
    delete_series_admin,
    update_series_admin,
)
from .panels import (
    insert_panels,
    get_panels,
    delete_panels,
    get_panel_original_url,
)
from .tokens import (
    insert_token_log,
    get_token_logs,
)


# Domain-typed wrapper functions
def get_project_domain(project_id: str) -> Optional[Project]:
    """Return a Project domain object for the given id, or None if not found."""
    raw = get_project(project_id)
    return Project.from_dict(raw) if raw else None


def get_all_projects_domain(user_id: Optional[str] = None) -> List[Project]:
    """Return all projects as typed Project domain objects."""
    return [Project.from_dict(r) for r in get_all_projects(user_id)]


def get_panels_domain(project_id: str) -> List[Panel]:
    """Return all panels for a project as typed Panel domain objects."""
    return [Panel.from_dict(r) for r in get_panels(project_id)]


def get_series_domain(series_slug: str) -> Optional[Series]:
    """Return a Series domain object by slug, or None if not found."""
    raw = get_series_by_slug(series_slug)
    return Series.from_dict(raw) if raw else None


def get_token_logs_domain(user_id: str) -> List[TokenLog]:
    """Return token usage logs as typed TokenLog domain objects."""
    return [TokenLog.from_dict(r) for r in get_token_logs(user_id)]
