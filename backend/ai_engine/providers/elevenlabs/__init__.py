"""
backend/app/providers/elevenlabs/__init__.py
─────────────────────────────────────────────────────────────────────────────
ElevenLabs Voice AI text-to-speech provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.elevenlabs.types import (
    ElevenLabsModel,
    VoiceSettings,
    DEFAULT_ELEVENLABS_VOICES,
)
from ai_engine.providers.elevenlabs.helpers import (
    resolve_voice_id,
    build_tts_payload,
)
from ai_engine.providers.elevenlabs.client import (
    ElevenLabsClient,
    ElevenLabsProvider,
)
from ai_engine.providers.elevenlabs.engine import (
    ElevenLabsEngine,
    get_elevenlabs_engine,
)

__all__ = [
    # Types
    "ElevenLabsModel",
    "VoiceSettings",
    "DEFAULT_ELEVENLABS_VOICES",
    # Client & Engine
    "ElevenLabsClient",
    "ElevenLabsProvider",
    "ElevenLabsEngine",
    "get_elevenlabs_engine",
    # Helpers
    "resolve_voice_id",
    "build_tts_payload",
]
