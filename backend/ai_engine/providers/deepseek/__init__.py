"""
backend/app/providers/deepseek/__init__.py
─────────────────────────────────────────────────────────────────────────────
DeepSeek reasoning and chat AI models provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.deepseek.types import (
    DeepSeekModel,
    DeepSeekMessage,
)
from ai_engine.providers.deepseek.helpers import (
    build_deepseek_headers,
    build_chat_payload,
)
from ai_engine.providers.deepseek.client import (
    DeepSeekClient,
    DeepSeekProvider,
)
from ai_engine.providers.deepseek.engine import (
    DeepSeekEngine,
    get_deepseek_engine,
)

__all__ = [
    # Types
    "DeepSeekModel",
    "DeepSeekMessage",
    # Client & Engine
    "DeepSeekClient",
    "DeepSeekProvider",
    "DeepSeekEngine",
    "get_deepseek_engine",
    # Helpers
    "build_deepseek_headers",
    "build_chat_payload",
]
