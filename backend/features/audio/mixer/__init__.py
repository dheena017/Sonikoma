"""
backend/features/audio/mixer/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio mixing and mastering sub-domain facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.mixer.track_mixer_service import mix_sound_tracks
from features.audio.mixer.auto_ducking_service import lower_music_when_speaking
from features.audio.mixer.music_loop_service import loop_music
from features.audio.mixer.volume_normalizer_service import balance_volume

__all__ = [
    "mix_sound_tracks",
    "lower_music_when_speaking",
    "loop_music",
    "balance_volume",
]
