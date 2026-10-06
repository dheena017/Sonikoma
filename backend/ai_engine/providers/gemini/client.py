"""
backend/app/providers/gemini/client.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini Provider Client:
- Models: Gemini 2.5 Pro / Flash, 2.0 Flash
- Exponential backoff retry execution wrapper
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, Optional, Union
from app.core.config import call_gemini_with_retry, genai_client, ai_initialized
from ai_engine.providers.gemini.types import GeminiModel, GeminiGenerationConfig
from ai_engine.providers.gemini.helpers import build_config_dict

logger = logging.getLogger("sonikoma.providers.gemini.client")

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except (ImportError, NameError, Exception):
    genai = None
    types = None
    GEMINI_AVAILABLE = False


class GeminiClient:
    """Wrapper provider client to interact with Google Gemini models."""

    @staticmethod
    def is_available() -> bool:
        return GEMINI_AVAILABLE and genai is not None

    @staticmethod
    def get_client(api_key: Optional[str] = None) -> Any:
        """Returns a configured Gemini Client instance."""
        if not GEMINI_AVAILABLE or genai is None:
            raise RuntimeError("google-genai package is not installed.")

        if api_key:
            return genai.Client(api_key=api_key)

        if not ai_initialized or not genai_client:
            raise RuntimeError("Gemini is not initialized and no API key was provided.")

        return genai_client

    @classmethod
    async def generate_content_with_retry(
        cls,
        client: Any,
        model: Union[GeminiModel, str],
        contents: Any,
        config: Optional[Any] = None,
        max_attempts: int = 2
    ) -> Any:
        """Executes a model generation call wrapped in the standard exponential backoff retrier."""
        model_str = model.value if isinstance(model, GeminiModel) else str(model)
        return await call_gemini_with_retry(
            lambda: client.models.generate_content(
                model=model_str,
                contents=contents,
                config=config
            ),
            max_attempts=max_attempts
        )


# Backward compatibility alias
GeminiProvider = GeminiClient
