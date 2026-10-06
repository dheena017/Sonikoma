"""
backend/features/workspace/services/shell_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for workspace editor shell context, canvas viewport, and tool modes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional, List

from database.engine import get_db_connection
from features.workspace.schemas import WorkspaceMode, WorkspaceContextResponse, WorkspaceStateUpdate

logger = logging.getLogger("sonikoma.features.workspace.shell")

WORKSPACE_MODES = [
    WorkspaceMode(id="storyboard", label="Storyboard Editor", icon="clapperboard", shortcut="1"),
    WorkspaceMode(id="viewer", label="Webtoon Viewer", icon="book-open", shortcut="2"),
    WorkspaceMode(id="imported_assets", label="Asset Library", icon="images", shortcut="3"),
    WorkspaceMode(id="image_editor", label="Panel Editor", icon="crop", shortcut="4"),
    WorkspaceMode(id="video_editor", label="Timeline Editor", icon="film", shortcut="5"),
]

_WORKSPACE_SESSIONS: Dict[str, Dict[str, Any]] = {}


class ShellService:
    """Business logic for workspace editor shell session state and viewport layout."""

    @staticmethod
    def get_workspace_modes() -> List[WorkspaceMode]:
        return list(WORKSPACE_MODES)

    @staticmethod
    def get_workspace_context(
        project_id: str,
        chapter_id: Optional[str] = None,
        user_id: str = "anonymous",
    ) -> WorkspaceContextResponse:
        session_key = f"{user_id}:{project_id}"

        # Query project name from database
        project_name = "Workspace Project"
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM projects WHERE id = ?", (project_id,))
                row = cursor.fetchone()
                if row and row[0]:
                    project_name = row[0]
        except Exception as e:
            logger.warning(f"[Workspace Shell] DB lookup warning for project {project_id}: {e}")

        session = _WORKSPACE_SESSIONS.get(session_key, {})
        return WorkspaceContextResponse(
            project_id=project_id,
            chapter_id=chapter_id or session.get("chapter_id"),
            project_name=project_name,
            active_mode=session.get("active_mode", "storyboard"),
            available_modes=WORKSPACE_MODES,
            viewport_zoom=session.get("viewport_zoom", 1.0),
            panel_split_layout=session.get("panel_split_layout", "horizontal"),
            sidebar_open=session.get("sidebar_open", True),
            metadata=session.get("metadata", {})
        )

    @staticmethod
    def update_workspace_context(
        project_id: str,
        body: WorkspaceStateUpdate,
        user_id: str = "anonymous",
    ) -> WorkspaceContextResponse:
        session_key = f"{user_id}:{project_id}"
        session = _WORKSPACE_SESSIONS.setdefault(session_key, {
            "chapter_id": None,
            "active_mode": "storyboard",
            "viewport_zoom": 1.0,
            "panel_split_layout": "horizontal",
            "sidebar_open": True,
            "metadata": {}
        })

        if body.active_mode is not None:
            session["active_mode"] = body.active_mode
        if body.chapter_id is not None:
            session["chapter_id"] = body.chapter_id
        if body.viewport_zoom is not None:
            session["viewport_zoom"] = body.viewport_zoom
        if body.panel_split_layout is not None:
            session["panel_split_layout"] = body.panel_split_layout
        if body.sidebar_open is not None:
            session["sidebar_open"] = body.sidebar_open
        if body.metadata is not None:
            session["metadata"].update(body.metadata)

        return ShellService.get_workspace_context(project_id, session.get("chapter_id"), user_id)


shell_service = ShellService()

__all__ = [
    "WORKSPACE_MODES",
    "ShellService",
    "shell_service",
]
