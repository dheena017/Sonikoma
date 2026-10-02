"""
backend/app/providers/openai/__init__.py
─────────────────────────────────────────────────────────────────────────────
OpenAI models and API provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.openai.types import (
    OpenAIModel,
    OpenAIMessage,
)
from app.providers.openai.helpers import (
    sanitize_messages,
    build_completion_params,
)
from app.providers.openai.client import (
    OpenAIClient,
    OpenAIProvider,
    OPENAI_AVAILABLE,
)
from app.providers.openai.engine import (
    OpenAIEngine,
    get_openai_engine,
)

__all__ = [
    # Types
    "OpenAIModel",
    "OpenAIMessage",
    # Client & Engine
    "OpenAIClient",
    "OpenAIProvider",
    "OpenAIEngine",
    "get_openai_engine",
    "OPENAI_AVAILABLE",
    # Helpers
    "sanitize_messages",
    "build_completion_params",
]
