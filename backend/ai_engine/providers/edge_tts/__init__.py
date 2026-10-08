"""
backend/app/providers/edge_tts/__init__.py
─────────────────────────────────────────────────────────────────────────────
Microsoft Edge Neural TTS speech synthesis provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.edge_tts.types import DEFAULT_VOICES, VOICE_LIST, VOICE_MAP
from ai_engine.providers.edge_tts.helpers import sanitize_speech_text
from ai_engine.providers.edge_tts.client import (
    EdgeTTSProvider,
    EdgeTTSClient,
    EDGE_TTS_AVAILABLE,
)
from ai_engine.providers.edge_tts.engine import (
    EdgeTTSEngine,
    get_edge_tts_engine,
)

__all__ = [
    # Types & Voices
    "DEFAULT_VOICES",
    "VOICE_LIST",
    "VOICE_MAP",
    # Client & Engine
    "EdgeTTSProvider",
    "EdgeTTSClient",
    "EdgeTTSEngine",
    "get_edge_tts_engine",
    "EDGE_TTS_AVAILABLE",
    # Helpers
    "sanitize_speech_text",
]
