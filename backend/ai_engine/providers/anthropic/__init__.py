"""
backend/app/providers/anthropic/__init__.py
─────────────────────────────────────────────────────────────────────────────
Anthropic Claude AI models provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.anthropic.types import (
    AnthropicModel,
    AnthropicMessage,
)
from ai_engine.providers.anthropic.helpers import (
    normalize_messages,
    build_message_params,
)
from ai_engine.providers.anthropic.client import (
    AnthropicClient,
    AnthropicProvider,
    ANTHROPIC_AVAILABLE,
)
from ai_engine.providers.anthropic.engine import (
    AnthropicEngine,
    get_anthropic_engine,
)

__all__ = [
    # Types
    "AnthropicModel",
    "AnthropicMessage",
    # Client & Engine
    "AnthropicClient",
    "AnthropicProvider",
    "AnthropicEngine",
    "get_anthropic_engine",
    "ANTHROPIC_AVAILABLE",
    # Helpers
    "normalize_messages",
    "build_message_params",
]
