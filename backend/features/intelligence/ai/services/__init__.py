"""
backend/features/intelligence/ai/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI domain services:
- facade: Multimodal AI generation facade for Gemini, Stable Diffusion, Anthropic, HuggingFace
- _deps: Provider credentials, token counting, and AI skill execution engine
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.ai.services import facade
from features.intelligence.ai.services import _deps
from features.intelligence.ai.services._deps import (
    get_user_gemini_key,
    default_output_path,
    run_md_skill,
)

__all__ = [
    "facade",
    "_deps",
    "get_user_gemini_key",
    "default_output_path",
    "run_md_skill",
]
