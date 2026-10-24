"""
Master API Router for the canonical AI domain (`features/ai`).

Aggregates all 10 sub-routers under /api/v1/ai:
- analysis: Vision parsing, smart crop, emotion, sound effects
- narrative: Story memory, pacing, script dramatization
- prompts: Prompt enhancement, image prompts, style presets
- agent: 1-click autonomous video director & jobs
- chat: Creative assistant chat
- translation: Comic speech & chapter localization
- thumbnails: High-CTR cover ideas, prompts & compositing
- series: AI multi-chapter series planner & dubber
- training: Custom YOLO comic detector training
- catalog: Models list, speed testing & token costs
"""

from fastapi import APIRouter

# Canonical Sub-Routers
from .analysis import router as analysis_router
from .narrative import router as narrative_router
from .prompts import router as prompts_router
from .agent import router as agent_router
from .chat import router as chat_router
from .translation import router as translation_router
from .thumbnails import router as thumbnails_router
from .series import router as series_router
from .training import router as training_router
from .catalog import router as catalog_router

ai_router = APIRouter()

# Register Canonical Routers
ai_router.include_router(analysis_router)
ai_router.include_router(narrative_router)
ai_router.include_router(prompts_router)
ai_router.include_router(agent_router)
ai_router.include_router(chat_router)
ai_router.include_router(translation_router)
ai_router.include_router(thumbnails_router)
ai_router.include_router(series_router)
ai_router.include_router(training_router)
ai_router.include_router(catalog_router)

router = ai_router

__all__ = [
    "ai_router",
    "router",
    "analysis_router",
    "narrative_router",
    "prompts_router",
    "agent_router",
    "chat_router",
    "translation_router",
    "thumbnails_router",
    "series_router",
    "training_router",
    "catalog_router",
]
