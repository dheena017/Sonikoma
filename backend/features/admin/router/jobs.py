"""
backend/features/admin/jobs/router.py
─────────────────────────────────────────────────────────────────────────────
Admin Background Jobs Router:
- Inspect all background tasks across the system
- Cancel specific job or cancel all active jobs
- Delete job record
- Purge completed/failed jobs
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from app.core.dependencies.auth import get_admin_user
from features.admin.services import admin_job_service
from features.platform.jobs import JobListResponse, JobStatusResponse
from common import get_client_ip

logger = logging.getLogger("sonikoma.admin.jobs")
router = APIRouter()


@router.get('/admin/jobs', response_model=JobListResponse, summary="Get all background jobs across the system (Admin only)")
async def admin_get_all_jobs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    chapter_id: Optional[str] = Query(None, description="Filter by chapter ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    job_type: Optional[str] = Query(None, description="Filter by job type"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_admin_user)
):
    """Retrieves all background jobs in the system."""
    jobs = admin_job_service.list_jobs(
        user_id=user_id,
        project_id=project_id,
        chapter_id=chapter_id,
        status=status,
        job_type=job_type,
        limit=limit,
        offset=offset
    )
    return JobListResponse(
        success=True,
        total=len(jobs),
        jobs=[j.to_status_response() for j in jobs]
    )


@router.post('/admin/jobs/{job_id}/cancel', response_model=JobStatusResponse, summary="Admin cancel a job")
async def admin_cancel_job(job_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    try:
        job = admin_job_service.cancel_job(job_id, current_user["user_id"], ip_addr)
        return job.to_status_response()
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")


@router.delete('/admin/jobs/{job_id}', summary="Admin delete a job record")
async def admin_delete_job(job_id: str, request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    try:
        return admin_job_service.delete_job(job_id, current_user["user_id"], ip_addr)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")


@router.post('/admin/jobs/purge-completed', summary="Admin purge completed/failed jobs")
async def admin_purge_completed_jobs(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    return admin_job_service.purge_completed_jobs(current_user["user_id"], ip_addr)


@router.post('/admin/jobs/cancel-all-active', summary="Admin cancel all currently active/queued jobs")
async def admin_cancel_all_active_jobs(request: Request, current_user: dict = Depends(get_admin_user)):
    ip_addr = get_client_ip(request)
    return admin_job_service.cancel_all_active_jobs(current_user["user_id"], ip_addr)
