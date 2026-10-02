"""
backend/app/providers/gemini/__init__.py
─────────────────────────────────────────────────────────────────────────────
Google Gemini GenAI SDK provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.gemini.types import (
    GeminiModel,
    GeminiGenerationConfig,
)
from app.providers.gemini.helpers import (
    build_config_dict,
    sanitize_prompt,
)
from app.providers.gemini.client import (
    GeminiClient,
    GeminiProvider,
    GEMINI_AVAILABLE,
)
from app.providers.gemini.engine import (
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
