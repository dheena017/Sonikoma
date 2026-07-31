"""
backend/app/providers/stable_diffusion/client.py
Wrapper for Stable Diffusion provider (moved from providers/ai/stable_diffusion_client.py).
"""

import logging
from typing import Any, Optional

logger = logging.getLogger("sonikoma.providers.stable_diffusion")

class StableDiffusionProvider:
    @staticmethod
    def generate(prompt: str, **kwargs) -> Any:
        raise NotImplementedError("Stable Diffusion client shim; implement per-provider client")
