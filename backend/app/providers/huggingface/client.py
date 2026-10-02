"""
backend/app/providers/huggingface/client.py
─────────────────────────────────────────────────────────────────────────────
Hugging Face Inference Provider Client:
- Models: black-forest-labs/FLUX.1-schnell, FLUX.1-dev, etc.
- Async text_to_image wrapper with auto-resizing and error handling
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import asyncio
import logging
from typing import Optional, Any, Union, Type

from app.providers.huggingface.types import HuggingFaceModel, ImageGenerationOptions
from app.providers.huggingface.helpers import trim_prompt, encode_image_bytes, resize_image_if_needed

logger = logging.getLogger("sonikoma.providers.huggingface.client")

try:
    from huggingface_hub import InferenceClient as _InferenceClient
    InferenceClient: Optional[Type[Any]] = _InferenceClient
    HUGGINGFACE_AVAILABLE = True
except ImportError:
    InferenceClient = None
    HUGGINGFACE_AVAILABLE = False


class HuggingFaceClient:
    """Wrapper provider client for Hugging Face Inference API."""

    @staticmethod
    def is_available() -> bool:
        return HUGGINGFACE_AVAILABLE and InferenceClient is not None

    @classmethod
    def get_client(cls, api_key: Optional[str] = None) -> Optional[Any]:
        """Returns a configured Hugging Face InferenceClient."""
        if not cls.is_available():
            logger.warning("[HuggingFaceClient] huggingface_hub is not installed.")
            return None

        key = api_key or os.getenv("HUGGINGFACE_API_KEY", "").strip()
        if not key:
            logger.warning("[HuggingFaceClient] No HUGGINGFACE_API_KEY configured in environment.")
            return None

        assert InferenceClient is not None, "InferenceClient must be available"
        return InferenceClient(api_key=key)

    @classmethod
    async def generate_image(
        cls,
        prompt: str,
        model: Union[HuggingFaceModel, str] = HuggingFaceModel.FLUX_SCHNELL,
        width: int = 768,
        height: int = 1024,
        quality: int = 90,
        api_key: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesize an image via HuggingFace Inference API in an async thread pool.
        Returns JPEG bytes or None if generation failed.
        """
        client = cls.get_client(api_key)
        if not client:
            return None

        model_str = model.value if isinstance(model, HuggingFaceModel) else str(model)
        clean_prompt = trim_prompt(prompt, max_chars=480)

        try:
            logger.info(f"[HuggingFaceClient] Synthesizing '{model_str}' ({width}x{height}) for prompt: {clean_prompt[:60]}...")

            text_to_image_fn = getattr(client, "text_to_image", None)
            if not callable(text_to_image_fn):
                logger.warning(
                    "[HuggingFaceClient] InferenceClient.text_to_image is not available. "
                    "Upgrade huggingface_hub: pip install -U huggingface_hub"
                )
                return None

            raw_img = await asyncio.to_thread(
                text_to_image_fn,
                clean_prompt,
                model=model_str,
            )

            if raw_img:
                resized = resize_image_if_needed(raw_img, width, height)
                return encode_image_bytes(resized, format="JPEG", quality=quality)

        except Exception as exc:
            logger.warning(f"[HuggingFaceClient] Image synthesis failed on '{model_str}': {exc}")
            return None

        return None


# Backward compatibility alias
HuggingFaceProvider = HuggingFaceClient
