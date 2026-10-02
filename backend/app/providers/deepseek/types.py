"""
backend/app/providers/deepseek/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and message dataclasses for DeepSeek AI.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any


class DeepSeekModel(str, Enum):
    """Available DeepSeek reasoning and chat checkpoints."""
    CHAT = "deepseek-chat"
    REASONER = "deepseek-reasoner"


@dataclass
class DeepSeekMessage:
    """Prompt role and message text contract."""
    role: str
    content: str
