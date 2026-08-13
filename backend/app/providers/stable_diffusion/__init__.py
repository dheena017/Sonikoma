"""
backend/app/providers/stable_diffusion/__init__.py
─────────────────────────────────────────────────────────────────────────────
Stable Diffusion text-to-image provider & engine package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.stable_diffusion.client import StableDiffusionProvider
from app.providers.stable_diffusion.engine import (
    get_stable_diffusion_engine,
    StableDiffusionEngine,
    StableDiffusionModel,
    GeneratedImage,
    DIFFUSERS_AVAILABLE,
)

__all__ = [
    "StableDiffusionProvider",
    "get_stable_diffusion_engine",
    "StableDiffusionEngine",
    "StableDiffusionModel",
    "GeneratedImage",
    "DIFFUSERS_AVAILABLE",
]
