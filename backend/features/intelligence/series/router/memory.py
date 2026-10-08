"""Continuous Improvement & Memory sub-router for AI Generated Series.

Exposes Creator Style Profiles, Franchise Continuity status, RLHF feedback loop,
and continuous optimization suggestions.
"""

from __future__ import annotations

import logging
from typing import List
from fastapi import APIRouter, HTTPException, status

from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.schemas import (
    CreatorStyleProfile,
    FranchiseContinuityMemory,
    GenerationFeedbackEvent,
    MemoryOptimizationSuggestion,
)
from features.intelligence.series.services.series_memory_engine import series_memory_engine

logger = logging.getLogger("sonikoma.series.router.memory")

router = APIRouter(tags=["AI Series - Memory & Learning Engine"])


@router.get("/creator-style", response_model=CreatorStyleProfile)
async def get_creator_style():
    """Retrieve creator style profile learned through iterative editing and rating feedback."""
    return series_memory_engine.get_creator_style()


@router.post("/creator-style", response_model=CreatorStyleProfile)
async def update_creator_style(profile: CreatorStyleProfile):
    """Manually update creator artistic preferences and style prompts."""
    series_memory_engine.save_creator_style(profile)
    logger.info(f"[Memory] Updated creator style profile for '{profile.creator_id}'.")
    return profile


@router.get("/{series_id}/continuity", response_model=FranchiseContinuityMemory)
async def get_series_continuity(series_id: str):
    """Retrieve franchise canon continuity: character scars, power levels, and lore timeline."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Memory] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found.",
        )
    return series_memory_engine.get_continuity(series_id)


@router.get("/{series_id}/suggestions", response_model=List[MemoryOptimizationSuggestion])
async def get_memory_suggestions(series_id: str):
    """Analyze continuity state and RLHF feedback to suggest storyline or visual tuning."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Memory] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found.",
        )
    suggestions = series_memory_engine.generate_optimization_suggestions(series_id)
    logger.info(f"[Memory] Generated {len(suggestions)} optimization suggestions for '{series_id}'.")
    return suggestions


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def log_feedback_event(event: GenerationFeedbackEvent):
    """Log an interactive user edit or rating (RLHF) to optimize future generations."""
    f_id = event.feedback_id or f"fb_{event.series_id[:8]}"
    series_memory_engine.record_feedback(event)
    logger.info(
        f"[Memory] Logged feedback event '{f_id}' for series '{event.series_id}' "
        f"(Type: {event.feedback_type}, Ch: {event.chapter_number})."
    )
    return {"status": "recorded", "feedback_id": f_id}
