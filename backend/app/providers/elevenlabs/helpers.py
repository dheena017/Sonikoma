"""
backend/app/providers/elevenlabs/helpers.py
─────────────────────────────────────────────────────────────────────────────
Helper functions for voice lookup, header generation, and payload building.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any, Optional
from app.providers.elevenlabs.types import (
    DEFAULT_ELEVENLABS_VOICES,
    VoiceSettings,
)


def resolve_voice_id(voice_identifier: str) -> str:
    """Resolve a voice alias (e.g. 'rachel', 'adam') to its ElevenLabs voice ID."""
    clean = voice_identifier.lower().strip()
    return DEFAULT_ELEVENLABS_VOICES.get(clean, voice_identifier)


def build_tts_payload(
    text: str,
    model_id: str = "eleven_multilingual_v2",
    settings: Optional[VoiceSettings] = None
) -> Dict[str, Any]:
    """Construct the JSON payload for ElevenLabs text-to-speech API."""
    cfg = settings or VoiceSettings()
    return {
        "text": text,
        "model_id": model_id,
        "voice_settings": {
            "stability": cfg.stability,
            "similarity_boost": cfg.similarity_boost,
            "style": cfg.style,
            "use_speaker_boost": cfg.use_speaker_boost,
        }
    }
