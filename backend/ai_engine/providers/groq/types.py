"""
backend/app/providers/groq/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, and message dataclasses for Groq LPU inference.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any


class GroqModel(str, Enum):
    """Supported ultra-fast LPU inference models on Groq."""
    LLAMA_3_3_70B = "llama-3.3-70b-versatile"
    LLAMA_3_1_8B = "llama-3.1-8b-instant"
    MIXTRAL_8X7B = "mixtral-8x7b-32768"
    GEMMA2_9B = "gemma2-9b-it"


@dataclass
class GroqMessage:
    """Prompt message contract."""
    role: str
    content: str
