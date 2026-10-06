"""
backend/app/providers/stable_diffusion/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and image generation dataclasses for Stable Diffusion.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Any


class StableDiffusionModel(str, Enum):
    """Supported Stable Diffusion checkpoint weights."""
    V1_5 = "runwayml/stable-diffusion-v1-5"
    V2_1 = "stabilityai/stable-diffusion-2-1"
    XL = "stabilityai/stable-diffusion-xl-base-1.0"
    TURBO = "stabilityai/sdxl-turbo"


@dataclass
class GeneratedImage:
    """Represents a generated diffusion image and its sampling metadata."""
    image_path: str
    image: Optional[Any] = None
    nsfw_content_detected: bool = False
    width: int = 512
    height: int = 512
    seed: int = 0
    prompt: str = ""
    negative_prompt: str = ""
    guidance_scale: float = 7.5
    num_inference_steps: int = 50
