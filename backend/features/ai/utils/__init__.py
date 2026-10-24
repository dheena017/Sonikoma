"""
backend/features/ai/utils
─────────────────────────────────────────────────────────────────────────────
Clean foundational helper utilities for AI operations.
─────────────────────────────────────────────────────────────────────────────
"""

from features.ai.utils.prompt_builder import fill_template
from features.ai.utils.clean_json import fix_bad_json
from features.ai.utils.speech_timer import count_speech_seconds
from features.ai.utils.image_loader import load_picture

__all__ = [
    "fill_template",
    "fix_bad_json",
    "count_speech_seconds",
    "load_picture",
]
