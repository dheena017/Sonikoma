"""
backend/app/providers/stable_diffusion/__init__.py
─────────────────────────────────────────────────────────────────────────────
Stable Diffusion text-to-image provider, engine, types, and helpers package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.stable_diffusion.types import (
    StableDiffusionModel,
    GeneratedImage,
)
from app.providers.stable_diffusion.helpers import (
    generate_seed,
    sanitize_prompt,
    format_seed_filename,
    build_generation_params,
)
from app.providers.stable_diffusion.client import (
    StableDiffusionClient,
    StableDiffusionProvider,
)
from app.providers.stable_diffusion.engine import (
    StableDiffusionEngine,
    get_stable_diffusion_engine,
    DIFFUSERS_AVAILABLE,
)

__all__ = [
    # Types
    "StableDiffusionModel",
    "GeneratedImage",
    # Helpers
    "generate_seed",
    "sanitize_prompt",
    "format_seed_filename",
    "build_generation_params",
    # Client & Engine
    "StableDiffusionClient",
    "StableDiffusionProvider",
    "StableDiffusionEngine",
    "get_stable_diffusion_engine",
    "DIFFUSERS_AVAILABLE",
]
