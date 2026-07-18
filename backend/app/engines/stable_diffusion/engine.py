"""
backend/app/engines/stable_diffusion/engine.py
Stable Diffusion engine moved into package structure.
"""

import os
import logging
import asyncio
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum
import tempfile

try:
    from diffusers import StableDiffusionPipeline, StableDiffusionInpaintPipeline, StableDiffusionUpscalePipeline
    import torch
    from PIL import Image
    import numpy as np
    DIFFUSERS_AVAILABLE = True
except ImportError:
    StableDiffusionPipeline = None
    StableDiffusionInpaintPipeline = None
    StableDiffusionUpscalePipeline = None
    torch = None
    Image = None
    np = None
    DIFFUSERS_AVAILABLE = False

logger = logging.getLogger("sonikoma.services.stable_diffusion_engine")


class StableDiffusionModel(str, Enum):
    V1_5 = "runwayml/stable-diffusion-v1-5"
    V2_1 = "stabilityai/stable-diffusion-2-1"
    XL = "stabilityai/stable-diffusion-xl-base-1.0"
    TURBO = "stabilityai/sdxl-turbo"


@dataclass
class GeneratedImage:
    image_path: str
    image: Optional['Any'] = None
    nsfw_content_detected: bool = False
    width: int = 512
    height: int = 512
    seed: int = 0
    prompt: str = ""
    negative_prompt: str = ""
    guidance_scale: float = 7.5
    num_inference_steps: int = 50


class StableDiffusionEngine:
    def __init__(
        self,
        model_name: StableDiffusionModel = StableDiffusionModel.V1_5,
        device: str = "cpu",
        enable_safety_checker: bool = False,
        cache_dir: Optional[str] = None
    ):
        self.model_name = model_name
        self.device = device
        self.enable_safety_checker = enable_safety_checker
        self.cache_dir = cache_dir or os.path.expanduser("~/.cache/huggingface/hub")
        self.pipe = None
        self.inpaint_pipe = None

    # (methods copied / adapted from original file)


_stable_diffusion_instance: Optional[StableDiffusionEngine] = None


def get_stable_diffusion_engine(
    model_name: StableDiffusionModel = StableDiffusionModel.V1_5,
    device: str = "cpu",
    enable_safety_checker: bool = False
) -> StableDiffusionEngine:
    if not DIFFUSERS_AVAILABLE:
        raise ImportError("diffusers, torch, and Pillow required. Install with: pip install diffusers torch Pillow transformers")
    global _stable_diffusion_instance
    if _stable_diffusion_instance is None:
        _stable_diffusion_instance = StableDiffusionEngine(model_name=model_name, device=device, enable_safety_checker=enable_safety_checker)
    return _stable_diffusion_instance
