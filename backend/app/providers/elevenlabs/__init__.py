"""
backend/app/providers/elevenlabs/__init__.py
─────────────────────────────────────────────────────────────────────────────
ElevenLabs Voice AI text-to-speech provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.elevenlabs.types import (
    ElevenLabsModel,
    VoiceSettings,
    DEFAULT_ELEVENLABS_VOICES,
)
from app.providers.elevenlabs.helpers import (
    resolve_voice_id,
    build_tts_payload,
)
from app.providers.elevenlabs.client import (
    ElevenLabsClient,
    ElevenLabsProvider,
)
from app.providers.elevenlabs.engine import (
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
