"""
backend/app/providers/openai/client.py
─────────────────────────────────────────────────────────────────────────────
OpenAI Foundation Provider Client:
- Models: GPT-4o, GPT-4o-mini, o1, o3-mini, DALL-E 3, TTS-1 HD
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Any, Dict, List, Union

from ai_engine.providers.openai.types import OpenAIModel, OpenAIMessage
from ai_engine.providers.openai.helpers import build_completion_params, sanitize_messages

logger = logging.getLogger("sonikoma.providers.openai.client")

try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    AsyncOpenAI = None
    OPENAI_AVAILABLE = False


class OpenAIClient:
    """Wrapper provider client for OpenAI API."""

    @classmethod
    def get_client(cls, api_key: Optional[str] = None) -> Optional[Any]:
        if not OPENAI_AVAILABLE or AsyncOpenAI is None:
            logger.warning("[OpenAIClient] openai package is not installed.")
            return None

        key = api_key or os.getenv("OPENAI_API_KEY", "").strip() or None
        if not key:
            return None

        return AsyncOpenAI(api_key=key)

    @classmethod
    async def chat_completion(
        cls,
        messages: List[Dict[str, str]],
        model: Union[OpenAIModel, str] = OpenAIModel.GPT_4O,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        api_key: Optional[str] = None,
    ) -> Optional[str]:
        client = cls.get_client(api_key)
        if not client:
            return None

        model_str = model.value if isinstance(model, OpenAIModel) else str(model)
        kwargs = build_completion_params(
            messages=messages,
            model=model_str,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        try:
            resp = await client.chat.completions.create(**kwargs)
            return resp.choices[0].message.content
        except Exception as exc:
            logger.error(f"[OpenAIClient] Chat completion error: {exc}")
            return None

    @classmethod
    async def generate_image(
        cls,
        prompt: str,
        model: str = "dall-e-3",
        size: str = "1792x1024",
        quality: str = "standard",
        api_key: Optional[str] = None,
    ) -> Optional[bytes]:
        """
        Synthesize an image via OpenAI DALL-E 3.
        Returns JPEG/PNG bytes or None if generation failed.
        """
        client = cls.get_client(api_key)
        if not client:
            logger.warning("[OpenAIClient] Cannot generate image: No OpenAI API key configured.")
            return None

        try:
            import base64
            clean_prompt = prompt.strip()[:1000]
            logger.info(f"[OpenAIClient] Synthesizing '{model}' ({size}) for prompt: {clean_prompt[:60]}...")
            resp = await client.images.generate(
                model=model,
                prompt=clean_prompt,
                size=size,
                quality=quality,
                n=1,
                response_format="b64_json",
            )
            if resp.data and len(resp.data) > 0 and resp.data[0].b64_json:
                return base64.b64decode(resp.data[0].b64_json)
        except Exception as exc:
            logger.warning(f"[OpenAIClient] DALL-E 3 generation failed: {exc}")
            return None

        return None


# Backward compatibility alias
OpenAIProvider = OpenAIClient

