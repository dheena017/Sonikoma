"""
backend/features/admin/projects/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Projects & Moderation Router:
- List all projects across the platform with filtering and search
- Update project status / flag projects
- Delete projects by admin
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.dependencies.auth import get_admin_user
from features.admin.schemas import AdminUpdateProject
from features.admin.services import admin_project_service
from common import get_client_ip

logger = logging.getLogger("sonikoma.admin.projects")
router = APIRouter()


@router.get('/admin/projects', summary="Get all system projects with filtering and pagination")
async def admin_get_projects(
    search: Optional[str] = Query(None, description="Search projects by title, author, or genre"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_flagged: Optional[bool] = Query(None, description="Filter by flagged state"),
    limit: int = Query(50, ge=1, le=500, description="Max projects to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_admin_user),
):
    try:
        return admin_project_service.list_projects(
            search=search, status=status, is_flagged=is_flagged, limit=limit, offset=offset
        )
    except Exception as e:
        logger.error(f'Failed to fetch projects: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/admin/projects/{project_id}', summary="Update project moderation flags or status")
async def admin_update_project(
    project_id: str,
    body: AdminUpdateProject,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        updates = body.dict(exclude_unset=True)
        return admin_project_service.update_project(
            project_id=project_id,
            updates=updates,
            reason=body.reason,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except Exception as e:
        logger.error(f'Failed to update project: {e}')
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/admin/projects/{project_id}', summary="Delete project as admin")
async def admin_delete_project(
    project_id: str,
    request: Request,
    current_user: dict = Depends(get_admin_user)
):
    ip_addr = get_client_ip(request)
    try:
        return admin_project_service.delete_project(
            project_id=project_id,
            current_admin_id=current_user["user_id"],
            ip_addr=ip_addr
        )
    except Exception as e:
        logger.error(f'Failed to delete project: {e}')
        raise HTTPException(status_code=500, detail=str(e))
