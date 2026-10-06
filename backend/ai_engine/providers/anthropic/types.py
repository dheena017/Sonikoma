"""
backend/app/providers/anthropic/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and message dataclasses for Anthropic Claude.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any


class AnthropicModel(str, Enum):
    """Supported Anthropic Claude frontier models."""
    CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20241022"
    CLAUDE_3_5_HAIKU = "claude-3-5-haiku-20241022"
    CLAUDE_3_OPUS = "claude-3-opus-20240229"


@dataclass
class AnthropicMessage:
    """Prompt role and message text contract."""
    role: str
    content: str
