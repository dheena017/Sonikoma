"""
backend/app/providers/anthropic/engine.py
─────────────────────────────────────────────────────────────────────────────
Anthropic Claude execution engine: high-level conversation & generation runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional, Union
from ai_engine.providers.anthropic.client import AnthropicClient
from ai_engine.providers.anthropic.types import AnthropicModel

logger = logging.getLogger("sonikoma.providers.anthropic.engine")


class AnthropicEngine:
    """Execution engine coordinating multi-turn Claude dialogs and text generation."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[AnthropicModel, str] = AnthropicModel.CLAUDE_3_5_SONNET):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[Union[AnthropicModel, str]] = None,
        max_tokens: int = 2048,
        temperature: Optional[float] = None,
    ) -> Optional[str]:
        """Execute a single prompt generation through Anthropic."""
        target_model = model or self.default_model
        messages = [{"role": "user", "content": prompt}]
        return await AnthropicClient.create_message(
            messages=messages,
            system=system,
            model=target_model,
            max_tokens=max_tokens,
            temperature=temperature,
            api_key=self.api_key,
        )

    async def run_conversation(
        self,
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        model: Optional[Union[AnthropicModel, str]] = None,
        max_tokens: int = 2048,
    ) -> Optional[str]:
        """Execute a full multi-turn conversation."""
        target_model = model or self.default_model
        return await AnthropicClient.create_message(
            messages=messages,
            system=system,
            model=target_model,
            max_tokens=max_tokens,
            api_key=self.api_key,
        )


_anthropic_engine_instance: Optional[AnthropicEngine] = None


def get_anthropic_engine(api_key: Optional[str] = None) -> AnthropicEngine:
    global _anthropic_engine_instance
    if _anthropic_engine_instance is None or api_key:
        _anthropic_engine_instance = AnthropicEngine(api_key=api_key)
    return _anthropic_engine_instance
