"""
backend/features/audio/sync/__init__.py
─────────────────────────────────────────────────────────────────────────────
Speech bubble and audio synchronization sub-domain facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.sync.text_audio_sync_service import sync_text_to_speech
from features.audio.sync.sound_wave_service import get_sound_waves
from features.audio.sync.backup_pacing_service import estimate_speech_timing

__all__ = [
    "sync_text_to_speech",
    "get_sound_waves",
    "estimate_speech_timing",
]
