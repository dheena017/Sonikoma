"""
backend/app/providers/huggingface/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and image generation options for Hugging Face.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class HuggingFaceModel(str, Enum):
    """Popular diffusion models available on Hugging Face Inference API."""
    FLUX_SCHNELL = "black-forest-labs/FLUX.1-schnell"
    FLUX_DEV = "black-forest-labs/FLUX.1-dev"
    STABLE_DIFFUSION_XL = "stabilityai/stable-diffusion-xl-base-1.0"
    SD_2_1 = "stabilityai/stable-diffusion-2-1"


@dataclass
class ImageGenerationOptions:
    """Dimensions, aspect ratio, and prompt options for image generation."""
    width: int = 768
    height: int = 1024
    quality: int = 90
