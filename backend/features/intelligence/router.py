"""
backend/features/intelligence/router.py
─────────────────────────────────────────────────────────────────────────────
Unified router for the Intelligence domain.
Combines sub-domains:
  - /ai: Multimodal vision, SD image generation, prompt engineering, audio scripts, translation
  - /series: Narrative continuity memory, character profiles, world-building, VFX cues
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.intelligence.ai.router import ai_router
from features.intelligence.series.router import series_router

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

router.include_router(ai_router, prefix="/ai", tags=["Intelligence: AI Models & Skills"])
router.include_router(series_router, prefix="/series", tags=["Intelligence: Series Narrative"])

intelligence_router = router

__all__ = [
    "router",
    "intelligence_router",
    "ai_router",
    "series_router",
]
