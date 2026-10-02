"""
backend/app/api/v1/ai/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI API routes package — assembles prompts, analytics, vision, narration,
chat, and translation sub-routers into `ai_router`.
─────────────────────────────────────────────────────────────────────────────
"""

from app.api.v1.ai.router import ai_router, stable_diffusion_router

# Alias: some modules import `router` directly from this package
router = ai_router

__all__ = ["ai_router", "stable_diffusion_router", "router"]
