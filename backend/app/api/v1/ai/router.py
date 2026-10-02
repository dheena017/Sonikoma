"""
backend/app/api/v1/ai/router.py
─────────────────────────────────────────────────────────────────────────────
Master Router for all AI Processing & Skill APIs:
- Model Catalog & Routing:   /api/v1/ai/list-models, /enhance-prompt, /test-model-latency
- Vision & Panel Analysis:   /api/v1/ai/analyze-single-image, /analyze-batch, /analyze-sequence, /analyze-all-panels
- Smart Crop & Detection:    /api/v1/ai/ai-smart-crop, /ai-smart-crop-batch, /detect-panels
- Image Generation (SD):     /api/v1/ai/generate-ai, /inpaint, /upscale, /style-transfer, /batch-generate
- Narration & Audio:         /api/v1/ai/skills/sfx-audio, /skills/bgm-vibe, /skills/shorts-script, etc.
- Script & Chat Skills:      /api/v1/ai/skills/dramatize, /skills/voice-cast, /skills/thumbnail, /skills/seo
- Translation:               /api/v1/ai/skills/translate
- Analytics & Provider Mgmt: /api/v1/ai/providers/verify, /stats, /credits
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from app.api.v1.ai.image import router as image_router
from app.api.v1.ai.narration import router as narration_router
from app.api.v1.ai.chat import router as chat_router
from app.api.v1.ai.translation import router as translation_router
from app.api.v1.ai.prompts import router as prompts_router
from app.api.v1.ai.analytics import router as analytics_router

ai_router = APIRouter()

# 1. Model catalog, provider routing & prompt utilities
ai_router.include_router(prompts_router,     tags=["06A. AI Model Catalog & Routing"])
ai_router.include_router(analytics_router,   tags=["06A. AI Model Catalog & Routing"])

# 2. Vision analysis & panel AI (analyze, smart-crop, SD generation)
ai_router.include_router(image_router,       tags=["06B. AI Vision & Panel Analysis"])

# 3. Narration — SFX, BGM, shorts scripts, arc planning
ai_router.include_router(narration_router,   tags=["06C. AI Narration & Audio Script"])

# 4. Script & creative skills — dramatize, voice-cast, SEO, thumbnails
ai_router.include_router(chat_router,        tags=["06D. AI Script & Creative Skills"])

# 5. Dialogue translation & localization
ai_router.include_router(translation_router, tags=["06E. AI Translation & Localization"])
