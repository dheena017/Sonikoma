"""Projects sub-router for AI Generated Series.

Handles creation, retrieval, listing, deletion, and background job status tracking
for AI Series projects.
"""

from __future__ import annotations

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from features.intelligence.series.schemas import (
    AISeriesProject,
    CreateAISeriesRequest,
    SeriesFormatType,
)
from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_orchestrator import series_orchestrator

logger = logging.getLogger("sonikoma.series.router.projects")

router = APIRouter(tags=["AI Series - Projects"])


@router.get("/", response_model=List[AISeriesProject])
async def list_ai_series(
    format_type: Optional[SeriesFormatType] = Query(None, description="Filter by format (manhwa, comic_manga, anime)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all AI Generated Series in Sonikoma with optional format filtering."""
    format_str = format_type.value if format_type else None
    projects = ai_series_repo.list_projects(format_filter=format_str, limit=limit, offset=offset)
    logger.debug(f"[Projects] Listed {len(projects)} series projects (format: {format_str}).")
    return projects


@router.post("/create", response_model=AISeriesProject, status_code=status.HTTP_201_CREATED)
async def create_ai_series(req: CreateAISeriesRequest):
    """Architect a new AI Generated Series with sessions, chapters, and instant Turbo Chapter 1 synthesis."""
    logger.info(f"[Projects] Request to create AI Series '{req.title}' (Format: {req.format_type}, Art Style: {req.art_style}).")
    try:
        project = await series_orchestrator.create_series_project(req)
        logger.info(f"[Projects] Successfully created project '{project.series_id}' with {len(project.sessions)} sessions.")
        return project
    except Exception as e:
        logger.exception(f"[Projects] Failed to architect AI Series '{req.title}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to architect AI Series: {str(e)}",
        )


@router.get("/{series_id}", response_model=AISeriesProject)
async def get_ai_series(series_id: str):
    """Retrieve full project details, sessions, chapters, and character DNA for an AI Generated Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Projects] Project '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found in database.",
        )
    return project


@router.get("/{series_id}/status")
async def get_series_job_status(series_id: str):
    """Retrieve real-time background chapter synthesis job status for a series project."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Series '{series_id}' not found.")
    job_status = series_orchestrator.get_job_status(series_id)
    return {
        "series_id": series_id,
        "title": project.title,
        "job": job_status,
    }


@router.delete("/{series_id}", status_code=status.HTTP_200_OK)
async def delete_ai_series(series_id: str):
    """Delete an AI Generated Series and all associated session data."""
    success = ai_series_repo.delete_project(series_id)
    if not success:
        logger.error(f"[Projects] Delete failed: Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found.",
        )
    logger.info(f"[Projects] Deleted series '{series_id}'.")
    return {"status": "success", "message": f"AI Series '{series_id}' deleted successfully."}
