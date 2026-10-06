"""
backend/app/providers/gemini/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, model enums, and configuration options for Google Gemini.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any


class GeminiModel(str, Enum):
    """Google Gemini GenAI models."""
    GEMINI_2_5_FLASH = "gemini-2.5-flash"
    GEMINI_2_5_PRO = "gemini-2.5-pro"
    GEMINI_2_0_FLASH = "gemini-2.0-flash"
    GEMINI_1_5_PRO = "gemini-1.5-pro"
    GEMINI_1_5_FLASH = "gemini-1.5-flash"


@dataclass
class GeminiGenerationConfig:
    """Sampling hyperparameters for Gemini model generation."""
    temperature: float = 0.7
    top_p: float = 0.95
    top_k: int = 40
    max_output_tokens: Optional[int] = None
    response_mime_type: Optional[str] = None
