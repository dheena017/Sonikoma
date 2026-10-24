"""
backend/features/audio/speech/__init__.py
─────────────────────────────────────────────────────────────────────────────
Speech and voice synthesis sub-domain facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.speech.panel_speech_service import make_panel_speech
from features.audio.speech.batch_speech_service import make_all_panel_speech
from features.audio.speech.voice_preview_service import preview_voice
from features.audio.speech.voice_list_service import (
    VOICE_MAP,
    VOICE_CATALOG,
    list_all_voices,
)

__all__ = [
    "make_panel_speech",
    "make_all_panel_speech",
    "preview_voice",
    "VOICE_MAP",
    "VOICE_CATALOG",
    "list_all_voices",
]
