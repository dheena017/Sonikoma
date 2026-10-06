"""
backend/app/providers/openai/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and message structures for OpenAI models.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any


class OpenAIModel(str, Enum):
    """Supported OpenAI foundational, reasoning, and image models."""
    GPT_4O = "gpt-4o"
    GPT_4O_MINI = "gpt-4o-mini"
    O1 = "o1"
    O3_MINI = "o3-mini"
    DALLE_3 = "dall-e-3"
    TTS_1_HD = "tts-1-hd"


@dataclass
class OpenAIMessage:
    """Prompt role and text content specification."""
    role: str
    content: str
