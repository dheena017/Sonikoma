"""
backend/app/api/v1/projects/transfers.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Project Transfers, Series Relationships, and Token Analytics routes:
- POST   /transfer                â€“ Temporary project transfer (Extension -> Web Studio)
- GET    /transfer/{project_id}   â€“ Retrieve staged project transfer
- GET    /analytics/tokens        â€“ Token usage and cost history
- POST   /{projectId}/tokens      â€“ Increment project token consumption
- GET    /series/{series_id_slug} â€“ Retrieve parent series details
- DELETE /series/{seriesId}       â€“ Delete parent series and all its child chapters
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import uuid
import logging
from typing import Optional, List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Path, Body, Depends, Query

try:
    from app.core.dependencies.auth import get_current_user
    from features.platform.projects.schemas_project import TokenIncrementRequest
    from features.platform.projects.repositories import (
        get_project,
        get_project_by_slug,
        delete_project,
        increment_project_tokens,
        insert_token_log,
        get_token_logs,
    )
    from features.platform.projects.services.project_service import get_series_details
    from database.engine import get_db_connection
except ImportError:
    from app.core.dependencies.auth import get_current_user
    from features.platform.projects.schemas_project import TokenIncrementRequest
    from features.platform.projects.repositories import (
        get_project,
        get_project_by_slug,
        delete_project,
        increment_project_tokens,
        insert_token_log,
        get_token_logs,
    )
    from features.platform.projects.services.project_service import get_series_details
    from database.engine import get_db_connection

logger = logging.getLogger("sonikoma.routes.projects.transfers")
router = APIRouter()


# â”€â”€ Temporary Storyboard Project Transfers (Extension -> Web Studio) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

_TEMPORARY_PROJECT_TRANSFERS: dict = {}


class ProjectTransferPayload(BaseModel):
    project_id: str
    url: Optional[str] = None
    title: Optional[str] = None
    chapter_title: Optional[str] = None
    series_title: Optional[str] = None
    panels: list = []
    scraped_images: list = []
    voice: Optional[str] = None
    music_theme: Optional[str] = None
    aspect_ratio: Optional[str] = None


@router.post("/transfer", summary="Store temporary storyboard project transferred from extension")
async def save_project_transfer(payload: ProjectTransferPayload):
    try:
        _TEMPORARY_PROJECT_TRANSFERS[payload.project_id] = payload.model_dump()
        if len(_TEMPORARY_PROJECT_TRANSFERS) > 100:
            oldest_key = next(iter(_TEMPORARY_PROJECT_TRANSFERS))
            _TEMPORARY_PROJECT_TRANSFERS.pop(oldest_key, None)
        logger.info(f"[Project Transfer] Stored transfer project {payload.project_id} with {len(payload.panels)} panels")
        return {"success": True, "project_id": payload.project_id}
    except Exception as e:
        logger.error(f"[Project Transfer] Error saving transfer: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/transfer/{project_id}", summary="Retrieve temporary storyboard project transferred from extension")
async def get_project_transfer(project_id: str = Path(..., description="Project ID")):
    data = _TEMPORARY_PROJECT_TRANSFERS.get(project_id)
    if not data:
        return {"success": False, "detail": "Transfer not found or expired"}
    return {"success": True, **data}


# â”€â”€ Token Usage & Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/analytics/tokens", summary="Get token usage history with pagination")
async def get_token_analytics_endpoint(
    project_id: Optional[str] = Query(None, description="Filter logs by project ID"),
    limit: int = Query(50, ge=1, le=500, description="Max logs to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user),
):
    try:
        logs = get_token_logs(current_user["user_id"])
        if project_id:
            logs = [l for l in logs if l.get("project_id") == project_id]
        total = len(logs)
        paginated = logs[offset:offset + limit]
        return {"success": True, "total": total, "token_logs": paginated}
    except Exception as e:
        logger.error(f"Failed to fetch token analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch token analytics")


@router.post("/{projectId}/tokens", summary="Increment project token usage")
async def increment_project_tokens_endpoint(
    projectId: str = Path(..., description="Target Project ID"),
    body: TokenIncrementRequest = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        project = get_project(projectId)
        if not project:
            project = get_project_by_slug(projectId)
            if project:
                projectId = project["project_id"]
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")
        if project.get("user_id") != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")

        resolved_job_id = body.job_id or project.get("job_id") or None
        increment_project_tokens(projectId, body.tokens)
        try:
            insert_token_log(
                log_id=str(uuid.uuid4()),
                project_id=projectId,
                input_tokens=body.tokens,
                output_tokens=0,
                total_tokens=body.tokens,
                estimated_cost_usd=round(body.tokens * 0.00000015, 6),
                job_id=resolved_job_id,
            )
        except Exception as log_err:
            logger.warning(f"[Tokens] insert_token_log failed (non-fatal): {log_err}")
        return {"success": True, "added": body.tokens}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment tokens: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to increment tokens: {e}")


# â”€â”€ Parent Series Relationships â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/series/{series_id_or_slug}", summary="Get parent series details")
async def get_series_endpoint(
    series_id_or_slug: str = Path(..., description="Parent series ID or URL slug"),
    current_user: dict = Depends(get_current_user),
):
    try:
        try:
            series = get_series_details(series_id_or_slug, current_user["user_id"])
            if not series:
                raise HTTPException(status_code=404, detail="Series not found.")
        except PermissionError:
            raise HTTPException(status_code=403, detail="Access denied.")
        return {"success": True, "series": series}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/series/{seriesId}", summary="Delete a series and its chapters")
async def delete_series_endpoint(
    seriesId: str = Path(..., description="Target parent series ID to delete"),
    current_user: dict = Depends(get_current_user),
):
    try:
        conn = get_db_connection()
        row = conn.execute("SELECT user_id FROM series WHERE id = ?", (seriesId,)).fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="Series not found.")
        if row["user_id"] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Access denied.")
        delete_project(seriesId)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete series: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to delete series: {e}")

