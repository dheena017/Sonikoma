"""
backend/app/providers/whisper/__init__.py
─────────────────────────────────────────────────────────────────────────────
Whisper Speech-to-Text inference provider, engine, and subtitle utilities.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.whisper.types import (
    WhisperModel,
    TranscriptionSegment,
    TranscriptionResult,
)
from app.providers.whisper.client import WhisperClient, WhisperProvider, WHISPER_AVAILABLE
from app.providers.whisper.engine import WhisperEngine, get_whisper_engine
from app.providers.whisper.helpers import (
    format_srt_time,
    format_vtt_time,
    segments_to_srt,
    segments_to_vtt,
)

__all__ = [
    # Contracts & Types
    "WhisperModel",
    "TranscriptionSegment",
    "TranscriptionResult",
    # Client & Engine
    "WhisperClient",
    "WhisperProvider",
    "WhisperEngine",
    "get_whisper_engine",
    "WHISPER_AVAILABLE",
    # Helpers
    "format_srt_time",
    "format_vtt_time",
    "segments_to_srt",
    "segments_to_vtt",
]
