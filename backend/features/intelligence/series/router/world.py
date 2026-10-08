"""World-Building Vault sub-router for AI Generated Series.

Manages universe rules, factions, canonical locations, and immutable world laws.
"""

from __future__ import annotations

import logging
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_memory_engine import series_memory_engine

logger = logging.getLogger("sonikoma.series.router.world")

router = APIRouter(tags=["AI Series - World Building"])


class WorldBibleUpdateRequest(BaseModel):
    world_bible: Dict[str, Any] = Field(..., description="World bible dictionary with lore_rules, setting_name, factions, locations")


@router.get("/{series_id}/world")
async def get_series_world(series_id: str):
    """Retrieve world-building bible, rules, locations, and lore constraints."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[World] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found.",
        )
    return {
        "series_id": series_id,
        "title": project.title,
        "world_bible": project.world_bible,
    }


@router.put("/{series_id}/world")
async def update_series_world(series_id: str, req: WorldBibleUpdateRequest):
    """Update world rules and sync immutable lore constraints to the continuity memory engine."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[World] Series '{series_id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"AI Series '{series_id}' not found.",
        )

    project.world_bible = req.world_bible
    ai_series_repo.update_project(project)

    # Sync lore rules, locations, and mysteries to memory
    continuity = series_memory_engine.get_continuity(series_id)
    if "lore_rules" in req.world_bible and isinstance(req.world_bible["lore_rules"], list):
        continuity.world_rules = req.world_bible["lore_rules"]
    if "canonical_locations" in req.world_bible and isinstance(req.world_bible["canonical_locations"], dict):
        continuity.canonical_locations.update(req.world_bible["canonical_locations"])
    if "unresolved_mysteries" in req.world_bible and isinstance(req.world_bible["unresolved_mysteries"], list):
        for m in req.world_bible["unresolved_mysteries"]:
            if m and m not in continuity.unresolved_threads:
                continuity.unresolved_threads.append(m)

    series_memory_engine.save_continuity(continuity)

    logger.info(f"[World] Successfully updated world bible for '{series_id}' ('{project.title}').")

    return {
        "status": "success",
        "series_id": series_id,
        "world_bible": project.world_bible,
    }
