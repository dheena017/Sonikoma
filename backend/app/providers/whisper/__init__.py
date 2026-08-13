"""
backend/app/providers/whisper/__init__.py
─────────────────────────────────────────────────────────────────────────────
Whisper speech transcription provider & engine package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.whisper.client import WhisperProvider
from app.providers.whisper.engine import (
    get_whisper_engine,
    WhisperModel,
    WHISPER_AVAILABLE,
    WhisperEngine,
)

__all__ = [
    "WhisperProvider",
    "get_whisper_engine",
    "WhisperModel",
    "WHISPER_AVAILABLE",
    "WhisperEngine",
]
