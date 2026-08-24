"""
backend/app/providers/gemini/client.py
Wrapper for Gemini provider (moved from providers/ai/gemini.py).
"""

import logging
from typing import Any, Optional
from app.core.config import call_gemini_with_retry, genai_client, ai_initialized

logger = logging.getLogger("sonikoma.services.ai.providers.gemini")

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except (ImportError, NameError, Exception):
    genai = None
    types = None
    GEMINI_AVAILABLE = False


class GeminiProvider:
    """Wrapper provider to interact with Google Gemini models."""

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

    @staticmethod
    async def generate_content_with_retry(
        client: Any,
        model: str,
        contents: Any,
        config: Optional[Any] = None,
        max_attempts: int = 2
    ) -> Any:
        """Executes a model generation call wrapped in the standard exponential backoff retrier."""

        return await call_gemini_with_retry(
            lambda: client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            ),
            max_attempts=max_attempts
        )
