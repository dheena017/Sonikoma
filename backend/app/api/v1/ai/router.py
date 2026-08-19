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
from app.api.v1.ai.analytics import router as analytics_router

ai_router = APIRouter()

# Include all sub-routers under specialized AI categories
ai_router.include_router(prompts_router, tags=["07A. AI Model Catalog & Routing"])
ai_router.include_router(analytics_router, tags=["07A. AI Model Catalog & Routing"])
ai_router.include_router(image_router, tags=["07B. AI Vision & Panel Analysis"])
ai_router.include_router(narration_router, tags=["07C. AI Dialogue & Script Writing"])
ai_router.include_router(chat_router, tags=["07C. AI Dialogue & Script Writing"])
ai_router.include_router(translation_router, tags=["07D. AI Translation & Localization"])

# Legacy / empty router expected by stable-diffusion mount
stable_diffusion_router = APIRouter()
