"""
backend/features/workspace/router/shell.py
─────────────────────────────────────────────────────────────────────────────
FastAPI router for workspace editor shell context, canvas viewport, and tool modes.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.workspace.schemas import WorkspaceContextResponse, WorkspaceStateUpdate
from features.workspace.services.shell_service import shell_service

logger = logging.getLogger("sonikoma.features.workspace.shell")

router = APIRouter(prefix="/shell", tags=["Workspace Shell"])


@router.get(
    "/context/{project_id}",
    response_model=WorkspaceContextResponse,
    summary="Get active workspace shell context and editor state",
    description="Loads project details, last active chapter, zoom level, and selected workspace mode."
)
async def get_workspace_context(
    project_id: str,
    chapter_id: Optional[str] = None,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return shell_service.get_workspace_context(project_id, chapter_id=chapter_id, user_id=user_id)


@router.post(
    "/context/{project_id}",
    response_model=WorkspaceContextResponse,
    summary="Update workspace editor shell state and viewport settings"
)
async def update_workspace_context(
    project_id: str,
    body: WorkspaceStateUpdate,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return shell_service.update_workspace_context(project_id, body, user_id=user_id)


shell_router = router

__all__ = ["router", "shell_router"]
