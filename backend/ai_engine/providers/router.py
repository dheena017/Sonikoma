"""
backend/app/api/v1/providers/router.py
─────────────────────────────────────────────────────────────────────────────
Master Router for all AI Foundation & Generation Provider APIs:
- Catalog & Discovery:   /api/v1/providers/models, /providers, /routing, /list-models
- Google Gemini:         /api/v1/providers/gemini
- OpenAI:                /api/v1/providers/openai
- Anthropic Claude:      /api/v1/providers/anthropic
- DeepSeek:              /api/v1/providers/deepseek
- Groq LPU:              /api/v1/providers/groq
- Hugging Face:          /api/v1/providers/huggingface
- Pollinations.ai:       /api/v1/providers/pollinations
- Stable Diffusion:      /api/v1/providers/stable-diffusion
- Microsoft Edge TTS:    /api/v1/providers/edge-tts
- ElevenLabs Voice AI:   /api/v1/providers/elevenlabs
- OpenAI Whisper:        /api/v1/providers/whisper
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from ai_engine.providers.gateway import router as gateway_router
from ai_engine.providers.catalog import router as catalog_router
from ai_engine.providers.gemini.router import router as gemini_router
from ai_engine.providers.openai.router import router as openai_router
from ai_engine.providers.anthropic.router import router as anthropic_router
from ai_engine.providers.deepseek.router import router as deepseek_router
from ai_engine.providers.groq.router import router as groq_router
from ai_engine.providers.huggingface.router import router as huggingface_router
from ai_engine.providers.pollinations.router import router as pollinations_router
from ai_engine.providers.stable_diffusion.router import router as stable_diffusion_router
from ai_engine.providers.edge_tts.router import router as edge_tts_router
from ai_engine.providers.elevenlabs.router import router as elevenlabs_router
from ai_engine.providers.whisper.router import router as whisper_router

providers_router = APIRouter()

# 0. Unified Gateway — /chat · /generate-image · /synthesize · /transcribe · /embed · /health
providers_router.include_router(
    gateway_router,
    tags=["07. AI Gateway (Use Anywhere)"]
)

# 1. Global Model Catalog, Provider Health & Routing Config
providers_router.include_router(
    catalog_router,
    tags=["07A. AI Model Catalog & Provider Registry"]
)

# 2. Foundation & Reasoning LLM Providers
providers_router.include_router(
    gemini_router,
    prefix="/gemini",
    tags=["07B. Google Gemini Provider"]
)
providers_router.include_router(
    openai_router,
    prefix="/openai",
    tags=["07C. OpenAI Provider"]
)
providers_router.include_router(
    anthropic_router,
    prefix="/anthropic",
    tags=["07D. Anthropic Claude Provider"]
)
providers_router.include_router(
    deepseek_router,
    prefix="/deepseek",
    tags=["07E. DeepSeek AI Provider"]
)
providers_router.include_router(
    groq_router,
    prefix="/groq",
    tags=["07F. Groq LPU Provider"]
)

# 3. Generative Diffusion & Image Synthesis Providers
providers_router.include_router(
    huggingface_router,
    prefix="/huggingface",
    tags=["07G. Hugging Face Provider"]
)
providers_router.include_router(
    pollinations_router,
    prefix="/pollinations",
    tags=["07H. Pollinations.ai Provider"]
)
providers_router.include_router(
    stable_diffusion_router,
    prefix="/stable-diffusion",
    tags=["07I. Stable Diffusion Local Engine"]
)

# 4. Neural Speech & Audio Studio Providers
providers_router.include_router(
    edge_tts_router,
    prefix="/edge-tts",
    tags=["07J. Microsoft Edge TTS Provider"]
)
providers_router.include_router(
    elevenlabs_router,
    prefix="/elevenlabs",
    tags=["07K. ElevenLabs Voice AI Provider"]
)
providers_router.include_router(
    whisper_router,
    prefix="/whisper",
    tags=["07L. OpenAI Whisper Transcription Provider"]
)
