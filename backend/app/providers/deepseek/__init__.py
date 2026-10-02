"""
backend/app/providers/deepseek/__init__.py
─────────────────────────────────────────────────────────────────────────────
DeepSeek reasoning and chat AI models provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.deepseek.types import (
    DeepSeekModel,
    DeepSeekMessage,
)
from app.providers.deepseek.helpers import (
    build_deepseek_headers,
    build_chat_payload,
)
from app.providers.deepseek.client import (
    DeepSeekClient,
    DeepSeekProvider,
)
from app.providers.deepseek.engine import (
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
