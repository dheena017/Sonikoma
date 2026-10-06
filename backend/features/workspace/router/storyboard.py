"""
backend/features/workspace/router/storyboard.py
─────────────────────────────────────────────────────────────────────────────
FastAPI router for workspace storyboard generation, frames, and audio cues.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, Request

from app.core.dependencies.auth import get_all_user_keys, get_current_user, get_optional_current_user
from features.platform.scraper.schemas_scraper import GenerateStoryboardOnlyRequest
from features.platform.jobs import JobStatusResponse
from features.workspace.schemas import StoryboardData, StoryboardUpdateRequest
from features.workspace.services.storyboard_service import storyboard_service

logger = logging.getLogger("sonikoma.features.workspace.storyboard")

router = APIRouter(prefix="/storyboard", tags=["Workspace Storyboard"])


@router.post(
    "/generate",
    response_model=JobStatusResponse,
    summary="Generate AI storyboard script (Creates GENERATE_STORYBOARD Job)",
    description="Asynchronously analyzes chapter panel images with LLM vision to extract scene descriptions, narrative flow, voiceover scripts, and audio cues."
)
async def generate_storyboard_endpoint(
    request: Request,
    body: GenerateStoryboardOnlyRequest,
    user_keys: dict = Depends(get_all_user_keys),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    return storyboard_service.create_generation_job(body, user_id=user_id, user_keys=user_keys)


@router.get(
    "/{project_id}/{chapter_id}",
    response_model=StoryboardData,
    summary="Get storyboard timeline frames and scripts",
    description="Retrieves ordered storyboard frames, dialogue scripts, durations, and audio cues."
)
async def get_storyboard_endpoint(
    project_id: str,
    chapter_id: str,
    current_user: dict = Depends(get_optional_current_user)
):
    return storyboard_service.get_storyboard(project_id, chapter_id)


@router.put(
    "/{project_id}/{chapter_id}",
    response_model=StoryboardData,
    summary="Save updated storyboard frames and dialogue",
    description="Persists edited voiceover scripts, camera moves, and scene durations."
)
async def save_storyboard_endpoint(
    project_id: str,
    chapter_id: str,
    body: StoryboardUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    return storyboard_service.save_storyboard(project_id, chapter_id, body)


# Alias for consumers
storyboard_router = router

__all__ = ["router", "storyboard_router"]
