"""
backend/app/api/v1/ai/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public package barrel export for AI API module.
─────────────────────────────────────────────────────────────────────────────
"""

from app.api.v1.ai.router import ai_router

# Alias: some modules import `router` directly from this package
router = ai_router

__all__ = ["ai_router", "router"]
