"""
backend/features/workspace/router/viewer.py
─────────────────────────────────────────────────────────────────────────────
FastAPI router for comic reader pages streaming and reading progress tracking.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user
from features.workspace.schemas import (
    ViewerChapterResponse,
    ViewerProgressResponse,
    ViewerProgressUpdate,
)
from features.workspace.services.viewer_service import viewer_service

logger = logging.getLogger("sonikoma.features.workspace.viewer")

router = APIRouter(prefix="/viewer", tags=["Workspace Viewer"])


@router.get(
    "/pages/{project_id}/{chapter_id}",
    response_model=ViewerChapterResponse,
    summary="Get ordered chapter reader pages",
    description="Returns ordered image pages, reading mode, and navigation links for webtoon or manga viewing."
)
async def get_chapter_pages_endpoint(
    project_id: str,
    chapter_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    return viewer_service.get_chapter_pages(project_id, chapter_id)


@router.get(
    "/progress/{project_id}/{chapter_id}",
    response_model=ViewerProgressResponse,
    summary="Get reading progress for a chapter"
)
async def get_progress_endpoint(
    project_id: str,
    chapter_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return viewer_service.get_progress(user_id, project_id, chapter_id)


@router.post(
    "/progress/{project_id}/{chapter_id}",
    response_model=ViewerProgressResponse,
    summary="Save reading progress and scroll position"
)
async def save_progress_endpoint(
    project_id: str,
    chapter_id: str,
    body: ViewerProgressUpdate,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return viewer_service.save_progress(user_id, project_id, chapter_id, body)


viewer_router = router

__all__ = ["router", "viewer_router"]
