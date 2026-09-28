"""Master Aggregator Router for AI Generated Series.

Mounts all domain-specific sub-routers under /api/v1/ai-series.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.series.projects import router as projects_router
from app.api.v1.series.chapters import router as chapters_router
from app.api.v1.series.bubbles import router as bubbles_router
from app.api.v1.series.characters import router as characters_router
from app.api.v1.series.world import router as world_router
from app.api.v1.series.narrative import router as narrative_router
from app.api.v1.series.audio import router as audio_router
from app.api.v1.series.vfx import router as vfx_router
from app.api.v1.series.memory import router as memory_router
from app.api.v1.series.export import router as export_router

ai_series_master_router = APIRouter()

# Mount all sub-routers
ai_series_master_router.include_router(projects_router)
ai_series_master_router.include_router(chapters_router)
ai_series_master_router.include_router(bubbles_router)
ai_series_master_router.include_router(characters_router)
ai_series_master_router.include_router(world_router)
ai_series_master_router.include_router(narrative_router)
ai_series_master_router.include_router(audio_router)
ai_series_master_router.include_router(vfx_router)
ai_series_master_router.include_router(memory_router)
ai_series_master_router.include_router(export_router)
