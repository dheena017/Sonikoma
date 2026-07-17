"""
backend/app/services/ai/providers/stable_diffusion_provider.py
─────────────────────────────────────────────────────────────────────────────
Wrapper interface for HuggingFace Diffusers and Stable Diffusion pipelines.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, Optional

logger = logging.getLogger("sonikoma.services.ai.providers.stable_diffusion")

try:
    from diffusers import (
        StableDiffusionPipeline,
        StableDiffusionInpaintPipeline,
        StableDiffusionUpscalePipeline
    )
    import torch
    DIFFUSERS_AVAILABLE = True
except ImportError:
    DIFFUSERS_AVAILABLE = False


class StableDiffusionProvider:
    """Provider interface for loading Diffusers pipelines."""

    @staticmethod
    def is_available() -> bool:
        return DIFFUSERS_AVAILABLE

    @staticmethod
    def load_text_to_image_pipeline(model_id: str, device: str = "cpu", cache_dir: Optional[str] = None) -> Any:
        """Loads a pretrained text-to-image Stable Diffusion pipeline."""
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers and torch packages are not installed.")
            
        logger.info(f"[StableDiffusionProvider] Loading Text2Image pipeline: {model_id} on {device}")
        pipe = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            cache_dir=cache_dir
        )
        return pipe.to(device)

    @staticmethod
    def load_inpaint_pipeline(model_id: str, device: str = "cpu", cache_dir: Optional[str] = None) -> Any:
        """Loads an inpainting Stable Diffusion pipeline."""
        if not DIFFUSERS_AVAILABLE:
            raise RuntimeError("diffusers and torch packages are not installed.")

        logger.info(f"[StableDiffusionProvider] Loading Inpaint pipeline: {model_id} on {device}")
        pipe = StableDiffusionInpaintPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            cache_dir=cache_dir
        )
        return pipe.to(device)
