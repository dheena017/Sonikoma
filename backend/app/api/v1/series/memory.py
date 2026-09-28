"""Continuous Improvement & Memory sub-router for AI Generated Series.

Exposes Creator Style Profiles, Franchise Continuity status, and the RLHF feedback loop.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.schemas.memory import (
    CreatorStyleProfile,
    FranchiseContinuityMemory,
    GenerationFeedbackEvent,
)
from app.services.series.series_memory_engine import series_memory_engine

router = APIRouter(tags=["AI Series - Memory & Learning Engine"])


@router.get("/creator-style", response_model=CreatorStyleProfile)
async def get_creator_style():
    """Retrieve creator style profile learned through iterative editing and rating feedback."""
    return series_memory_engine.get_creator_style()


@router.post("/creator-style", response_model=CreatorStyleProfile)
async def update_creator_style(profile: CreatorStyleProfile):
    """Manually update creator artistic preferences and style prompts."""
    series_memory_engine.save_creator_style(profile)
    return profile


@router.get("/{series_id}/continuity", response_model=FranchiseContinuityMemory)
async def get_series_continuity(series_id: str):
    """Retrieve franchise canon continuity: character scars, power levels, and lore timeline."""
    return series_memory_engine.get_continuity(series_id)


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def log_feedback_event(event: GenerationFeedbackEvent):
    """Log an interactive user edit or rating (RLHF) to optimize future generations."""
    series_memory_engine.record_feedback(event)
    return {"status": "recorded", "feedback_id": event.feedback_id}
