"""
backend/common/audio/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Audio Domain Primitives:
- constants: Audio extensions, sample rates, MIME maps
- helpers: Speech duration estimation, TTS script sanitization, audio duration formatting
─────────────────────────────────────────────────────────────────────────────
"""

from .constants import (
    SUPPORTED_AUDIO_FORMATS,
    AUDIO_MIME_TYPES,
    STANDARD_SAMPLE_RATES,
    DEFAULT_SAMPLE_RATE,
    DEFAULT_WPM,
)
from .helpers import (
    estimate_speech_duration,
    clean_speech_script,
    format_audio_duration,
    to_natural_sentence_case,
    normalize_comic_text_for_human_speech,
    sanitize_text_for_tts,
)

__all__ = [
    # Constants
    "SUPPORTED_AUDIO_FORMATS",
    "AUDIO_MIME_TYPES",
    "STANDARD_SAMPLE_RATES",
    "DEFAULT_SAMPLE_RATE",
    "DEFAULT_WPM",
    # Helpers
    "estimate_speech_duration",
    "clean_speech_script",
    "format_audio_duration",
    "to_natural_sentence_case",
    "normalize_comic_text_for_human_speech",
    "sanitize_text_for_tts",
]
