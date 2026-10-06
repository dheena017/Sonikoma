"""
backend/features/intelligence/series/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Master Aggregator Router for AI Generated Series.
Mounts all domain-specific sub-routers under /api/v1/ai-series.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
from fastapi import APIRouter

from features.intelligence.series.router.projects import router as projects_router
from features.intelligence.series.router.chapters import router as chapters_router
from features.intelligence.series.router.bubbles import router as bubbles_router
from features.intelligence.series.router.characters import router as characters_router
from features.intelligence.series.router.world import router as world_router
from features.intelligence.series.router.narrative import router as narrative_router
from features.intelligence.series.router.audio import router as audio_router
from features.intelligence.series.router.vfx import router as vfx_router
from features.intelligence.series.router.memory import router as memory_router
from features.intelligence.series.router.export import router as export_router

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

# Aliases for consumers
series_router = ai_series_master_router
router = ai_series_master_router

__all__ = [
    "ai_series_master_router",
    "series_router",
    "router",
    "projects_router",
    "chapters_router",
    "bubbles_router",
    "characters_router",
    "world_router",
    "narrative_router",
    "audio_router",
    "vfx_router",
    "memory_router",
    "export_router",
]
