"""
backend/app/providers/openai/engine.py
─────────────────────────────────────────────────────────────────────────────
OpenAI execution engine: multi-turn dialogue, vision reasoning & generation runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional, Union
from app.providers.openai.client import OpenAIClient
from app.providers.openai.types import OpenAIModel

logger = logging.getLogger("sonikoma.providers.openai.engine")


class OpenAIEngine:
    """Execution engine coordinating OpenAI chat completions and reasoning."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[OpenAIModel, str] = OpenAIModel.GPT_4O):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_text(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[Union[OpenAIModel, str]] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ) -> Optional[str]:
        """Execute a prompt generation through OpenAI."""
        target_model = model or self.default_model
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        return await OpenAIClient.chat_completion(
            messages=messages,
            model=target_model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=self.api_key,
        )

    async def run_dialogue(
        self,
        messages: List[Dict[str, str]],
        model: Optional[Union[OpenAIModel, str]] = None,
        temperature: float = 0.7,
    ) -> Optional[str]:
        """Execute a full multi-turn conversation."""
        target_model = model or self.default_model
        return await OpenAIClient.chat_completion(
            messages=messages,
            model=target_model,
            temperature=temperature,
            api_key=self.api_key,
        )


_openai_engine_instance: Optional[OpenAIEngine] = None


def get_openai_engine(api_key: Optional[str] = None) -> OpenAIEngine:
    global _openai_engine_instance
    if _openai_engine_instance is None or api_key:
        _openai_engine_instance = OpenAIEngine(api_key=api_key)
    return _openai_engine_instance
