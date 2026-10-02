"""
backend/app/providers/anthropic/__init__.py
─────────────────────────────────────────────────────────────────────────────
Anthropic Claude AI models provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.anthropic.types import (
    AnthropicModel,
    AnthropicMessage,
)
from app.providers.anthropic.helpers import (
    normalize_messages,
    build_message_params,
)
from app.providers.anthropic.client import (
    AnthropicClient,
    AnthropicProvider,
    ANTHROPIC_AVAILABLE,
)
from app.providers.anthropic.engine import (
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
