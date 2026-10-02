"""
backend/app/api/v1/providers/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public package barrel export for all AI Model & Engine Provider API Routers:
- providers_router: Master consolidating router
- Individual provider routers for modular mounting
─────────────────────────────────────────────────────────────────────────────
"""

from app.api.v1.providers.router import providers_router
from app.api.v1.providers.catalog import router as catalog_router
from app.api.v1.providers.gemini import router as gemini_router
from app.api.v1.providers.openai import router as openai_router
from app.api.v1.providers.anthropic import router as anthropic_router
from app.api.v1.providers.deepseek import router as deepseek_router
from app.api.v1.providers.groq import router as groq_router
from app.api.v1.providers.huggingface import router as huggingface_router
from app.api.v1.providers.pollinations import router as pollinations_router
from app.api.v1.providers.stable_diffusion import router as stable_diffusion_router
from app.api.v1.providers.edge_tts import router as edge_tts_router
from app.api.v1.providers.elevenlabs import router as elevenlabs_router
from app.api.v1.providers.whisper import router as whisper_router

__all__ = [
    "providers_router",
    "gateway_router",
    "catalog_router",
    "gemini_router",
    "openai_router",
    "anthropic_router",
    "deepseek_router",
    "groq_router",
    "huggingface_router",
    "pollinations_router",
    "stable_diffusion_router",
    "edge_tts_router",
    "elevenlabs_router",
    "whisper_router",
]
