"""
backend/app/api/v1/ai/__init__.py
Re-exports the main routers for backward compatibility.
"""

from api.v1.ai.router import ai_router, stable_diffusion_router

# Legacy aliases
router = ai_router

__all__ = ["ai_router", "stable_diffusion_router", "router"]
