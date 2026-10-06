"""
backend/app/providers/gemini/__init__.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini GenAI SDK provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.gemini.types import (
    GeminiModel,
    GeminiGenerationConfig,
)
from ai_engine.providers.gemini.helpers import (
    build_config_dict,
    sanitize_prompt,
)
from ai_engine.providers.gemini.client import (
    GeminiClient,
    GeminiProvider,
    GEMINI_AVAILABLE,
)
from ai_engine.providers.gemini.engine import (
    GeminiEngine,
    get_gemini_engine,
)

__all__ = [
    # Types
    "GeminiModel",
    "GeminiGenerationConfig",
    # Client & Engine
    "GeminiClient",
    "GeminiProvider",
    "GeminiEngine",
    "get_gemini_engine",
    "GEMINI_AVAILABLE",
    # Helpers
    "build_config_dict",
    "sanitize_prompt",
]
