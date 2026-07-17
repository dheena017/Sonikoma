"""
api/v1/projects/update.py
─────────────────────────────────────────────────────────────────────────────
Routes for updating project data: metadata, panels, and token increments.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Path, Body, Depends, Request

from api.dependencies.auth import get_current_user
from schemas.project import PanelsSaveRequest, TokenIncrementRequest, ProjectUpdateRequest
from repositories.user_repository import write_audit_log
from services.project.project_service import ProjectService

logger = logging.getLogger("sonikoma.routes.projects.update")
router = APIRouter()
service = ProjectService()


# ── Routes ────────────────────────────────────────────────────────────────


@router.post("/{projectId}/panels", summary="Save storyboard panels for a project")
async def save_project_panels(
    request: Request,
    projectId: str = Path(...),
    body: PanelsSaveRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Saving {len(body.panels)} panels for project: {projectId}"
        )
        try:
            result = service.save_project_panels(
                projectId,
                body.panels,
                current_user["user_id"],
                audit_logger=write_audit_log,
                request_client=request.client.host if request.client else "127.0.0.1",
            )
        except ValueError as exc:
            logger.warning(f"[Database] Cannot save panels, project {projectId} not found.")
            raise HTTPException(status_code=404, detail="Project not found.") from exc
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        logger.info(
            f"[Database] Saved {len(body.panels)} panels and updated count for project: {projectId}"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save panels: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to save panels: {e}")


@router.post("/{projectId}/tokens", summary="Increment project token usage")
async def increment_project_tokens_route(
    projectId: str = Path(...),
    body: TokenIncrementRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Incrementing {body.tokens} tokens for project: {projectId}"
        )
        try:
            result = service.increment_project_tokens(projectId, body.tokens, current_user["user_id"])
        except ValueError as exc:
            raise HTTPException(status_code=404, detail="Project not found.") from exc
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        logger.info(f"[Database] Added {body.tokens} tokens to project {projectId}.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment tokens: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to increment tokens: {e}"
        )


@router.put("/{projectId}", summary="Update project metadata and panels")
async def update_project_details(
    projectId: str = Path(...),
    body: ProjectUpdateRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"[Database] Updating project details and/or panels for: {projectId}"
        )

        try:
            service.sync_project_to_supabase(projectId, body, current_user["user_id"])
            logger.info(
                f"Successfully saved project JSON to Supabase for {projectId}"
            )
        except Exception as e:
            logger.error(f"Failed to sync project JSON to Supabase: {e}")

        try:
            result = service.update_project_details(projectId, body, current_user["user_id"])
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail="Access denied.") from exc

        logger.info(
            f"[Database] Project {projectId} updated successfully. "
            f"slugs: {result.get('series_slug')}/{result.get('chapter_slug')}"
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update project: {e}")
