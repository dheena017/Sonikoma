"""
backend/app/providers/anthropic/client.py
─────────────────────────────────────────────────────────────────────────────
Anthropic Claude Provider Client:
- Models: claude-3-5-sonnet, claude-3-5-haiku
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Any, Dict, List, Union

from ai_engine.providers.anthropic.types import AnthropicModel, AnthropicMessage
from ai_engine.providers.anthropic.helpers import build_message_params, normalize_messages

logger = logging.getLogger("sonikoma.providers.anthropic.client")

try:
    from anthropic import AsyncAnthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    AsyncAnthropic = None
    ANTHROPIC_AVAILABLE = False


class AnthropicClient:
    """Wrapper provider client for Anthropic Claude models."""

    @classmethod
    def get_client(cls, api_key: Optional[str] = None) -> Optional[Any]:
        if not ANTHROPIC_AVAILABLE or AsyncAnthropic is None:
            logger.warning("[AnthropicClient] anthropic package is not installed.")
            return None

        key = api_key or os.getenv("ANTHROPIC_API_KEY", "").strip() or None
        if not key:
            return None

        return AsyncAnthropic(api_key=key)

    @classmethod
    async def create_message(
        cls,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        model: Union[AnthropicModel, str] = AnthropicModel.CLAUDE_3_5_SONNET,
        max_tokens: int = 2048,
        temperature: Optional[float] = None,
        api_key: Optional[str] = None,
    ) -> Optional[str]:
        client = cls.get_client(api_key)
        if not client:
            return None

        model_str = model.value if isinstance(model, AnthropicModel) else str(model)
        kwargs = build_message_params(
            messages=messages,
            model=model_str,
            max_tokens=max_tokens,
            system=system,
            temperature=temperature,
        )

        try:
            resp = await client.messages.create(**kwargs)
            return resp.content[0].text
        except Exception as exc:
            logger.error(f"[AnthropicClient] Message creation error: {exc}")
            return None


# Backward compatibility alias
AnthropicProvider = AnthropicClient
