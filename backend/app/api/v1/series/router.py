"""
backend/app/api/v1/series/router.py
─────────────────────────────────────────────────────────────────────────────
REST API endpoints for Multi-Chapter Series creation, progressive generation,
and real-time chapter session tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Path

from api.dependencies.auth import get_current_user, get_optional_current_user
from schemas.series import CreateSeriesRequest, SeriesResponse
from services.series.series_orchestrator import create_and_start_series
from repositories.project.series import (
    get_series,
    get_series_for_user,
    get_chapters_for_series,
    delete_series,
)
from repositories.project.panels import get_panels

logger = logging.getLogger("sonikoma.api.series")
series_router = APIRouter(prefix="/series", tags=["Multi-Chapter Series"])


@series_router.post("/create", summary="Create a new AI-generated multi-chapter series")
async def create_series_endpoint(
    request: CreateSeriesRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Creates a new multi-chapter series (Anime, Manhwa, or Comic/Manga) with up to 25 chapters.
    Initiates Chapter 1 priority generation immediately, while Chapters 2..N queue in the background.
    """
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"

    try:
        result = create_and_start_series(request, user_id)
        return result
    except Exception as e:
        logger.error(f"[Series API] Failed to create series: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create series: {str(e)}")


@series_router.get("/user/all", summary="Get all series created by current user")
async def get_user_series_endpoint(
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """Returns all series projects belonging to the user."""
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    series_list = get_series_for_user(user_id)
    return {"success": True, "series": series_list}


@series_router.get("/{series_id}", summary="Get series metadata and all chapter statuses")
async def get_series_endpoint(
    series_id: str = Path(..., description="Series ID or slug"),
):
    """Returns series information along with all nested chapter sessions and progress."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found.")

    chapters = get_chapters_for_series(series["id"])
    return {
        "success": True,
        "series": {
            **series,
            "chapters": chapters,
        }
    }


@series_router.get("/{series_id}/chapters", summary="Get chapters with live generation progress")
async def get_series_chapters_endpoint(
    series_id: str = Path(..., description="Series ID"),
):
    """Polling endpoint for the frontend to track progressive generation of chapters."""
    series = get_series(series_id)
    if not series:
        raise HTTPException(status_code=404, detail=f"Series '{series_id}' not found.")

    chapters = get_chapters_for_series(series["id"])
    return {
        "success": True,
        "series_id": series["id"],
        "total_chapters": len(chapters),
        "chapters": chapters,
    }


@series_router.get("/chapter/{chapter_id}", summary="Get single chapter details with panels")
async def get_chapter_details_endpoint(
    chapter_id: str = Path(..., description="Chapter ID"),
):
    """Returns a specific chapter session along with its panels (for webtoon reader or video player)."""
    from database.engine import get_db_connection
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT * FROM chapters WHERE id = ?", (chapter_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Chapter '{chapter_id}' not found.")
        chapter_dict = dict(row)
        panels = get_panels(chapter_id)
        return {
            "success": True,
            "chapter": {
                **chapter_dict,
                "panels": panels,
            }
        }
    finally:
        conn.close()


@series_router.delete("/{series_id}", summary="Delete series and all chapters")
async def delete_series_endpoint(
    series_id: str = Path(..., description="Series ID to delete"),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """Deletes the series and cleans up all media files."""
    try:
        delete_series(series_id)
        return {"success": True, "message": f"Series '{series_id}' deleted successfully."}
    except Exception as e:
        logger.error(f"[Series API] Failed to delete series: {e}")
        raise HTTPException(status_code=500, detail=str(e))
