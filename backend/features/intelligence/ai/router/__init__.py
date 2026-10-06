"""
backend/features/intelligence/ai/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified router aggregating all AI model, generation, and skill sub-routers:
- Image generation (SD, Flux, Gemini)
- Dialogue & script narration
- Assistant chat & persona chat
- Translation & localization
- Prompt enhancement & latency tests
- Analytics, telemetry, token ledger
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.intelligence.ai.router.image import router as image_router
from features.intelligence.ai.router.narration import router as narration_router
from features.intelligence.ai.router.chat import router as chat_router
from features.intelligence.ai.router.translation import router as translation_router
from features.intelligence.ai.router.prompts import router as prompts_router
from features.intelligence.ai.router.analytics import router as analytics_router

ai_router = APIRouter()

ai_router.include_router(image_router)
ai_router.include_router(narration_router)
ai_router.include_router(chat_router)
ai_router.include_router(translation_router)
ai_router.include_router(prompts_router)
ai_router.include_router(analytics_router)

router = ai_router

__all__ = [
    "ai_router",
    "router",
    "image_router",
    "narration_router",
    "chat_router",
    "translation_router",
    "prompts_router",
    "analytics_router",
]
