"""
backend/app/providers/huggingface/engine.py
─────────────────────────────────────────────────────────────────────────────
Hugging Face Inference execution engine: diffusion pipeline & generation runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Union
from app.providers.huggingface.client import HuggingFaceClient
from app.providers.huggingface.types import HuggingFaceModel

logger = logging.getLogger("sonikoma.providers.huggingface.engine")


class HuggingFaceEngine:
    """Execution engine coordinating diffusion generation via Hugging Face Inference API."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[HuggingFaceModel, str] = HuggingFaceModel.FLUX_SCHNELL):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_panel(
        self,
        prompt: str,
        width: int = 768,
        height: int = 1024,
        model: Optional[Union[HuggingFaceModel, str]] = None,
        quality: int = 90,
    ) -> Optional[bytes]:
        """Synthesize a manga panel image using Hugging Face FLUX.1 models."""
        target_model = model or self.default_model
        return await HuggingFaceClient.generate_image(
            prompt=prompt,
            model=target_model,
            width=width,
            height=height,
            quality=quality,
            api_key=self.api_key,
        )


_huggingface_engine_instance: Optional[HuggingFaceEngine] = None


def get_huggingface_engine(api_key: Optional[str] = None) -> HuggingFaceEngine:
    global _huggingface_engine_instance
    if _huggingface_engine_instance is None or api_key:
        _huggingface_engine_instance = HuggingFaceEngine(api_key=api_key)
    return _huggingface_engine_instance
