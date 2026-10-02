"""
backend/app/providers/gemini/engine.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini GenAI execution engine: multi-modal orchestration & structured runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, Optional, Union, Dict
from app.providers.gemini.client import GeminiClient
from app.providers.gemini.types import GeminiModel, GeminiGenerationConfig
from app.providers.gemini.helpers import build_config_dict

logger = logging.getLogger("sonikoma.providers.gemini.engine")


class GeminiEngine:
    """Execution engine for Google Gemini model generation and retries."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[GeminiModel, str] = GeminiModel.GEMINI_2_5_FLASH):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_text(
        self,
        prompt: str,
        model: Optional[Union[GeminiModel, str]] = None,
        config: Optional[GeminiGenerationConfig] = None,
        max_attempts: int = 2,
    ) -> Any:
        """Generate text or response payload with automated backoff retry."""
        client = GeminiClient.get_client(self.api_key)
        target_model = model or self.default_model
        cfg_dict = build_config_dict(config) if config else None

        return await GeminiClient.generate_content_with_retry(
            client=client,
            model=target_model,
            contents=prompt,
            config=cfg_dict,
            max_attempts=max_attempts,
        )


_gemini_engine_instance: Optional[GeminiEngine] = None


def get_gemini_engine(api_key: Optional[str] = None) -> GeminiEngine:
    global _gemini_engine_instance
    if _gemini_engine_instance is None or api_key:
        _gemini_engine_instance = GeminiEngine(api_key=api_key)
    return _gemini_engine_instance
