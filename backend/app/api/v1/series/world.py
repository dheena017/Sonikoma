"""World-Building Vault sub-router for AI Generated Series.

Manages universe rules, factions, canonical locations, and immutable world laws.
"""

from __future__ import annotations

from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.repositories.series import ai_series_repo
from app.services.series.series_memory_engine import series_memory_engine

router = APIRouter(tags=["AI Series - World Building"])


class WorldBibleUpdateRequest(BaseModel):
    world_bible: Dict[str, Any]


@router.get("/{series_id}/world")
async def get_series_world(series_id: str):
    """Retrieve world-building bible, rules, locations, and lore constraints."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")
    return project.world_bible


@router.put("/{series_id}/world")
async def update_series_world(series_id: str, req: WorldBibleUpdateRequest):
    """Update world rules and sync immutable lore constraints to the continuity memory engine."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"AI Series '{series_id}' not found.")

    project.world_bible = req.world_bible
    ai_series_repo.update_project(project)

    # Sync lore rules to memory
    continuity = series_memory_engine.get_continuity(series_id)
    continuity.world_rules = req.world_bible.get("lore_rules", continuity.world_rules)
    series_memory_engine.save_continuity(continuity)

    return {"status": "success", "world_bible": project.world_bible}
