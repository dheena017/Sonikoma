"""
api/v1/projects/create.py
─────────────────────────────────────────────────────────────────────────────
Project creation routes and token-usage calculation helper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from schemas.project import ProjectCreateRequest
from services.project.project_service import ProjectService

logger = logging.getLogger("sonikoma.routes.projects.create")
router = APIRouter()
service = ProjectService()


# ── Routes ────────────────────────────────────────────────────────────────


@router.post("", summary="Create a new project entry")
async def create_project(
    body: ProjectCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Attempting to create new project: {body.project_id} "
            f"for user {current_user['user_id']}"
        )
        result = service.create_project(body, current_user["user_id"])
        logger.info(
            f"[Database] Created project {body.project_id} successfully: '{body.title}'"
        )
        return result
    except Exception as e:
        logger.error(f"Failed to save project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save project: {e}")
