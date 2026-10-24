"""
backend/features/audio/utils/__init__.py
─────────────────────────────────────────────────────────────────────────────
Foundational audio utilities facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.utils.clean_text import clean_comic_text
from features.audio.utils.audio_math import (
    decibels_to_volume,
    volume_to_decibels,
    guess_speaking_seconds,
    seconds_to_samples,
)
from features.audio.utils.audio_files import (
    download_audio,
    cache_audio,
    save_audio,
)

__all__ = [
    # Clean text
    "clean_comic_text",
    # Audio math
    "decibels_to_volume",
    "volume_to_decibels",
    "guess_speaking_seconds",
    "seconds_to_samples",
    # Audio files
    "download_audio",
    "cache_audio",
    "save_audio",
]
