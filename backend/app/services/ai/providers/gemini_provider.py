"""
backend/app/services/ai/providers/gemini_provider.py
─────────────────────────────────────────────────────────────────────────────
Wrapper interface for Google Gemini GenAI Client and retry helpers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Callable, Any, Optional
from core.config import call_gemini_with_retry, genai_client, ai_initialized

logger = logging.getLogger("sonikoma.services.ai.providers.gemini")

try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    genai = None
    types = None
    GEMINI_AVAILABLE = False


class GeminiProvider:
    """Wrapper provider to interact with Google Gemini models."""

    @staticmethod
    def get_client(api_key: Optional[str] = None) -> Any:
        """Returns a configured Gemini Client instance."""
        if not GEMINI_AVAILABLE:
            raise RuntimeError("google-genai package is not installed.")
        
        if api_key:
            return genai.Client(api_key=api_key)
        
        if not ai_initialized:
            raise RuntimeError("Gemini is not initialized and no API key was provided.")
            
        return genai_client

    @staticmethod
    async def generate_content_with_retry(
        client: Any,
        model: str,
        contents: Any,
        config: Optional[Any] = None,
        max_attempts: int = 5
    ) -> Any:
        """Executes a model generation call wrapped in the standard exponential backoff retrier."""
        # Translate gemini-3.5 selections to gemini-2.5-pro or gemini-2.5-flash
        model_lower = model.lower()
        if "gemini-3.5" in model_lower:
            if "pro" in model_lower:
                model = "gemini-2.5-pro"
            else:
                model = "gemini-2.5-flash"
            logger.info(f"[GeminiProvider] Translated gemini-3.5 selection to: {model}")

        return await call_gemini_with_retry(
            lambda: client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            ),
            max_attempts=max_attempts
        )
