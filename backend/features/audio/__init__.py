"""
backend/features/audio/__init__.py
─────────────────────────────────────────────────────────────────────────────
Canonical Audio Domain Package.
Exports unified AudioService, audio_router, sub-domain modules, schemas,
and all canonical plain English functions.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.router import audio_router, router
from features.audio.service import AudioService, audio_service
from features.audio import schemas
from features.audio import speech
from features.audio import mixer
from features.audio import subtitles
from features.audio import sync
from features.audio import analysis
from features.audio import settings
from features.audio import utils

# Speech
from features.audio.speech import (
    list_all_voices,
    preview_voice,
    make_panel_speech,
    make_all_panel_speech,
)

# Mixer
from features.audio.mixer import (
    lower_music_when_speaking,
    loop_music,
    balance_volume,
    mix_sound_tracks,
)

# Subtitles
from features.audio.subtitles import (
    turn_speech_into_text,
    make_srt_subtitles,
    make_vtt_subtitles,
    get_word_times,
    turn_many_files_into_text,
)

# Sync
from features.audio.sync import (
    get_sound_waves,
    estimate_speech_timing,
    sync_text_to_speech,
)

# Analysis
from features.audio.analysis import (
    find_silent_parts,
    split_audio_by_energy,
    check_sound_details,
    cut_audio_clip,
)

# Settings & Presets
from features.audio.settings import (
    load_audio_settings,
    save_audio_settings,
    get_preset_voices,
)

# Utils
from features.audio.utils import (
    clean_comic_text,
    decibels_to_volume,
    volume_to_decibels,
    guess_speaking_seconds,
    seconds_to_samples,
    download_audio,
    cache_audio,
    save_audio,
)

__all__ = [
    "audio_router",
    "router",
    "AudioService",
    "audio_service",
    "schemas",
    "speech",
    "mixer",
    "subtitles",
    "sync",
    "analysis",
    "settings",
    "utils",
    # Functions
    "list_all_voices",
    "preview_voice",
    "make_panel_speech",
    "make_all_panel_speech",
    "lower_music_when_speaking",
    "loop_music",
    "balance_volume",
    "mix_sound_tracks",
    "turn_speech_into_text",
    "make_srt_subtitles",
    "make_vtt_subtitles",
    "get_word_times",
    "turn_many_files_into_text",
    "get_sound_waves",
    "estimate_speech_timing",
    "sync_text_to_speech",
    "find_silent_parts",
    "split_audio_by_energy",
    "check_sound_details",
    "cut_audio_clip",
    "load_audio_settings",
    "save_audio_settings",
    "get_preset_voices",
    "clean_comic_text",
    "decibels_to_volume",
    "volume_to_decibels",
    "guess_speaking_seconds",
    "seconds_to_samples",
    "download_audio",
    "cache_audio",
    "save_audio",
]
