"""
backend/app/api/v1/jobs.py
─────────────────────────────────────────────────────────────────────────────
Canonical REST API routes for unified Job tracking, status polling, and cancellation.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query

from services.jobs import job_manager, JobRecord

logger = logging.getLogger("sonikoma.api.jobs")

jobs_router = APIRouter()


@jobs_router.get("/{job_id}", summary="Get job status, progress, stage, and result")
async def get_job_status(job_id: str):
    """Canonical job status retrieval endpoint."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job.model_dump()


@jobs_router.post("/{job_id}/cancel", summary="Cancel a running or queued job")
async def cancel_job_route(job_id: str):
    """Cancels a running or queued job."""
    job = job_manager.cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")
    return job.model_dump()


@jobs_router.get("/", summary="List jobs optionally filtered by project")
async def list_jobs_route(project_id: Optional[str] = Query(None)):
    """Lists jobs, optionally filtered by project_id."""
    jobs = job_manager.list_jobs(project_id=project_id)
    return {"success": True, "total": len(jobs), "jobs": [j.model_dump() for j in jobs]}
