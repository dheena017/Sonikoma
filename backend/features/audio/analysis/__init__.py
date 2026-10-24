"""
backend/features/audio/analysis/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio signal analysis, silence detection, and clipping sub-domain facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.analysis.silence_finder_service import find_silent_parts
from features.audio.analysis.energy_split_service import split_audio_by_energy
from features.audio.analysis.sound_info_service import check_sound_details
from features.audio.analysis.audio_cutter_service import cut_audio_clip

__all__ = [
    "find_silent_parts",
    "split_audio_by_energy",
    "check_sound_details",
    "cut_audio_clip",
]
