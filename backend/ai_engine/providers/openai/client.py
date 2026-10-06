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


# Backward compatibility alias
OpenAIProvider = OpenAIClient
