"""
backend/common/audio/constants.py
─────────────────────────────────────────────────────────────────────────────
Audio format extensions, MIME types, and sample rate standards.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Set

SUPPORTED_AUDIO_FORMATS: Set[str] = {
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".flac",
    ".aac",
    ".wma",
}

AUDIO_MIME_TYPES: Dict[str, str] = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
    ".aac": "audio/aac",
}

STANDARD_SAMPLE_RATES = [16000, 22050, 24000, 44100, 48000]
DEFAULT_SAMPLE_RATE: int = 24000
DEFAULT_WPM: int = 145  # Standard narrative speaking speed (words per minute)

__all__ = [
    "SUPPORTED_AUDIO_FORMATS",
    "AUDIO_MIME_TYPES",
    "STANDARD_SAMPLE_RATES",
    "DEFAULT_SAMPLE_RATE",
    "DEFAULT_WPM",
]
