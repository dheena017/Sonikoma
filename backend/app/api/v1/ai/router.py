"""
backend/app/api/v1/ai/router.py
─────────────────────────────────────────────────────────────────────────────
Coordinating router for all AI processing sub-routers.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

# Import sub-routers
from api.v1.ai.image import router as image_router
from api.v1.ai.narration import router as narration_router
from api.v1.ai.chat import router as chat_router
from api.v1.ai.translation import router as translation_router
from api.v1.ai.prompts import router as prompts_router

ai_router = APIRouter()

# Include all sub-routers under ai_router
ai_router.include_router(image_router)
ai_router.include_router(narration_router)
ai_router.include_router(chat_router)
ai_router.include_router(translation_router)
ai_router.include_router(prompts_router)

# Legacy / empty router expected by stable-diffusion mount
stable_diffusion_router = APIRouter()
