"""
backend/app/providers/groq/engine.py
─────────────────────────────────────────────────────────────────────────────
Groq Cloud LPU execution engine: high-throughput inference & dialogue runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any, Optional, Union
from app.providers.groq.client import GroqClient
from app.providers.groq.types import GroqModel

logger = logging.getLogger("sonikoma.providers.groq.engine")


class GroqEngine:
    """Execution engine coordinating ultra-fast 500+ tok/s Groq LPU completions."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[GroqModel, str] = GroqModel.LLAMA_3_3_70B):
        self.api_key = api_key
        self.default_model = default_model

    async def chat(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[Union[GroqModel, str]] = None,
        temperature: float = 0.6,
        max_tokens: Optional[int] = None,
    ) -> Optional[str]:
        """Execute a prompt through Groq LPU."""
        target_model = model or self.default_model
        messages: List[Dict[str, str]] = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        return await GroqClient.chat_completion(
            messages=messages,
            model=target_model,
            temperature=temperature,
            max_tokens=max_tokens,
            api_key=self.api_key,
        )


_groq_engine_instance: Optional[GroqEngine] = None


def get_groq_engine(api_key: Optional[str] = None) -> GroqEngine:
    global _groq_engine_instance
    if _groq_engine_instance is None or api_key:
        _groq_engine_instance = GroqEngine(api_key=api_key)
    return _groq_engine_instance
