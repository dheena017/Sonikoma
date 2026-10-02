"""
backend/app/providers/deepseek/engine.py
─────────────────────────────────────────────────────────────────────────────
DeepSeek execution engine: reasoning extraction and conversation runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional, Union
from app.providers.deepseek.client import DeepSeekClient
from app.providers.deepseek.types import DeepSeekModel

logger = logging.getLogger("sonikoma.providers.deepseek.engine")


class DeepSeekEngine:
    """Execution engine for DeepSeek V3 chat and R1 reasoning tasks."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[DeepSeekModel, str] = DeepSeekModel.CHAT):
        self.api_key = api_key
        self.default_model = default_model

    async def chat(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[Union[DeepSeekModel, str]] = None,
        temperature: float = 0.7,
    ) -> Optional[str]:
        """Execute a single-turn prompt with optional system guidance."""
        target_model = model or self.default_model
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        return await DeepSeekClient.chat_completion(
            messages=messages,
            model=target_model,
            temperature=temperature,
            api_key=self.api_key,
        )

    async def run_reasoning(
        self,
        prompt: str,
        system: Optional[str] = None,
    ) -> Optional[str]:
        """Route to DeepSeek R1 reasoning model."""
        return await self.chat(
            prompt=prompt,
            system=system,
            model=DeepSeekModel.REASONER,
            temperature=0.6,
        )


_deepseek_engine_instance: Optional[DeepSeekEngine] = None


def get_deepseek_engine(api_key: Optional[str] = None) -> DeepSeekEngine:
    global _deepseek_engine_instance
    if _deepseek_engine_instance is None or api_key:
        _deepseek_engine_instance = DeepSeekEngine(api_key=api_key)
    return _deepseek_engine_instance
