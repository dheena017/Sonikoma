"""Projects sub-router for AI Generated Series.

Handles creation, retrieval, listing, and deletion of AI Series projects.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.series import (
    AISeriesProject,
    CreateAISeriesRequest,
    SeriesFormatType,
)
from app.repositories.series import ai_series_repo
from app.services.series.series_orchestrator import series_orchestrator

router = APIRouter(tags=["AI Series - Projects"])


@router.get("/", response_model=List[AISeriesProject])
async def list_ai_series(
    format_type: Optional[SeriesFormatType] = Query(None, description="Filter by format (manhwa, comic_manga, anime)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all AI Generated Series in Sonikoma with optional format filtering."""
    format_str = format_type.value if format_type else None
    return ai_series_repo.list_projects(format_filter=format_str, limit=limit, offset=offset)


@router.post("/create", response_model=AISeriesProject, status_code=status.HTTP_201_CREATED)
async def create_ai_series(req: CreateAISeriesRequest):
    """Architect a new AI Generated Series with sessions, chapters, and instant Turbo Chapter 1 synthesis."""
    try:
        project = await series_orchestrator.create_series_project(req)
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to architect AI Series: {str(e)}")


@router.get("/{series_id}", response_model=AISeriesProject)
async def get_ai_series(series_id: str):
    """Retrieve full project details, sessions, chapters, and character DNA for an AI Generated Series."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")
    return project


@router.delete("/{series_id}", status_code=status.HTTP_200_OK)
async def delete_ai_series(series_id: str):
    """Delete an AI Generated Series and all associated session data."""
    success = ai_series_repo.delete_project(series_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")
    return {"status": "success", "message": f"AI Series '{series_id}' deleted successfully."}
