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
from services.jobs import job_manager, JobRecord

logger = logging.getLogger("sonikoma.api.jobs")

jobs_router = APIRouter()

@jobs_router.get("/{job_id}", summary="Get job status, progress, stage, and result")
async def get_job_status(job_id: str, current_user: dict = Depends(get_current_user)):
    """Canonical job status retrieval endpoint."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    if job.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this job.")
    return job.model_dump()

@jobs_router.post("/{job_id}/cancel", summary="Cancel a running or queued job")
async def cancel_job_route(job_id: str, current_user: dict = Depends(get_current_user)):
    """Cancels a running or queued job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    if job.user_id != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this job.")
    job = job_manager.cancel_job(job_id)
    return job.model_dump()

@jobs_router.get("/", summary="List jobs optionally filtered by project")
async def list_jobs_route(project_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    """Lists jobs, optionally filtered by project_id."""
    jobs = job_manager.list_jobs(user_id=current_user["user_id"], project_id=project_id)
    return {"success": True, "total": len(jobs), "jobs": [j.model_dump() for j in jobs]}
