"""
backend/app/api/v1/jobs.py
─────────────────────────────────────────────────────────────────────────────
Canonical REST API routes for unified Job tracking, status polling, and cancellation.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends

from api.dependencies.auth import get_current_user
from services.jobs import job_manager, JobRecord, JobStatusResponse, JobListResponse

logger = logging.getLogger("sonikoma.api.jobs")

jobs_router = APIRouter()

@jobs_router.get(
    "/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status, progress, stage, execution, and result",
    description="Returns the full execution state of a specific job including provider, model, attempt, stage, progress, project_id, and chapter_id."
)
async def get_job_status_endpoint(job_id: str, current_user: dict = Depends(get_current_user)):
    """Canonical job status retrieval endpoint."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    if job.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this job.")
    return job.to_status_response()

@jobs_router.post(
    "/{job_id}/cancel",
    response_model=JobStatusResponse,
    summary="Cancel a running or queued job",
    description="Cancels an active background execution task."
)
async def cancel_job_endpoint(job_id: str, current_user: dict = Depends(get_current_user)):
    """Cancels a running or queued job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    if job.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this job.")
    job = job_manager.cancel_job(job_id)
    return job.to_status_response()

@jobs_router.get(
    "/",
    response_model=JobListResponse,
    summary="List jobs with filtering and pagination",
    description="Retrieves a paginated list of background execution jobs for the authenticated user, filterable by project_id, chapter_id, status, and job_type."
)
async def list_jobs_endpoint(
    project_id: Optional[str] = Query(None, description="Filter by parent Project/Series ID"),
    chapter_id: Optional[str] = Query(None, description="Filter by Chapter/Episode ID"),
    status: Optional[str] = Query(None, description="Filter by status: QUEUED, RUNNING, COMPLETED, FAILED, CANCELLED"),
    job_type: Optional[str] = Query(None, description="Filter by Job Type (e.g. SCRAPE_CHAPTER, PANEL_SPLIT, GENERATE_STORYBOARD, RENDER_VIDEO)"),
    limit: int = Query(50, ge=1, le=200, description="Max number of jobs to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: dict = Depends(get_current_user)
):
    """Lists jobs, optionally filtered by project_id, chapter_id, status, and type."""
    jobs = job_manager.list_jobs(
        user_id=current_user["user_id"],
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
        jobs=[j.to_status_response() for j in jobs],
    )
