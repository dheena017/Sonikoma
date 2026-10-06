"""
backend/features/video_editor/audio/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio sub-domain services entry point.
Exposes TTS synthesis, voice catalog, text normalization, speech transcription,
dialogue alignment, audio track mixing, presets/settings, and Librosa audio signal
processing.
─────────────────────────────────────────────────────────────────────────────
"""

# 1. Text-to-Speech (TTS) Synthesis
from features.video_editor.audio.services.tts import (
    generate_panel_audio,
    generate_tts_audio,
    generate_segment_with_retry,
    synthesize_panel_narration_audio,
    synthesize_dialogue_to_speech,
    # Batch & caching services
    cache_audio_base64,
    synthesize_panel_audio_service,
    batch_synthesize_panels_service,
)

# 2. Voice Catalog & Mappings
from features.video_editor.audio.services.voice_catalog import (
    VOICE_MAP,
    DEFAULT_VOICE,
    get_available_voices,
    get_supported_voice_list,
    normalize_voice_name,
)

# 3. Comic Text Normalization for Speech
from common.audio import (
    normalize_comic_text_for_human_speech,
    to_natural_sentence_case,
    sanitize_text_for_tts,
)

# 4. Multi-Track Audio Mixing & Ducking
from features.video_editor.audio.services.mixer import (
    mix_audio_tracks_service,
)

# 5. Audio Settings & Voice Presets
from features.video_editor.audio.services.settings import (
    _global_audio_settings,
    DEFAULT_AUDIO_PRESETS,
    get_audio_settings_service,
    update_audio_settings_service,
    get_audio_presets_service,
)

# 6. Speech Transcription & Subtitle Generation
from features.video_editor.audio.services.transcription import (
    generate_srt,
    generate_vtt,
    extract_words_with_timestamps,
    generate_json_transcript,
    batch_transcribe,
    transcribe_audio_service,
    generate_srt_service,
    generate_vtt_service,
    extract_words_service,
    batch_transcribe_service,
    transcribe_audio_to_text,
    export_srt_subtitles,
    export_vtt_subtitles,
    extract_timestamped_words,
)

# 7. Dialogue Alignment & Peak Extraction
from features.video_editor.audio.services.alignment import (
    align_dialogue_and_extract_peaks,
    align_dialogue_service,
    align_dialogue_with_audio_timestamps,
)

# 8. Audio Signal Processing & Spectral Statistics
from features.video_editor.audio.services.processing import (
    detect_silence,
    segment_by_energy,
    extract_summary_stats,
    save_audio_segment,
    analyze_audio_service,
    detect_silence_service,
    segment_by_energy_service,
    load_audio_service,
    detect_audio_silence_segments,
    segment_audio_by_energy_peaks,
    analyze_audio_spectral_stats,
)

__all__ = [
    # TTS
    "generate_panel_audio",
    "generate_tts_audio",
    "generate_segment_with_retry",
    "synthesize_panel_narration_audio",
    "synthesize_dialogue_to_speech",
    "cache_audio_base64",
    "synthesize_panel_audio_service",
    "batch_synthesize_panels_service",
    # Voice Catalog
    "VOICE_MAP",
    "DEFAULT_VOICE",
    "get_available_voices",
    "get_supported_voice_list",
    "normalize_voice_name",
    # Text Normalizer
    "normalize_comic_text_for_human_speech",
    "to_natural_sentence_case",
    "sanitize_text_for_tts",
    # Mixer
    "mix_audio_tracks_service",
    # Settings
    "_global_audio_settings",
    "DEFAULT_AUDIO_PRESETS",
    "get_audio_settings_service",
    "update_audio_settings_service",
    "get_audio_presets_service",
    # Transcription
    "generate_srt",
    "generate_vtt",
    "extract_words_with_timestamps",
    "generate_json_transcript",
    "batch_transcribe",
    "transcribe_audio_service",
    "generate_srt_service",
    "generate_vtt_service",
    "extract_words_service",
    "batch_transcribe_service",
    "transcribe_audio_to_text",
    "export_srt_subtitles",
    "export_vtt_subtitles",
    "extract_timestamped_words",
    # Alignment
    "align_dialogue_and_extract_peaks",
    "align_dialogue_service",
    "align_dialogue_with_audio_timestamps",
    # Processing
    "detect_silence",
    "segment_by_energy",
    "extract_summary_stats",
    "save_audio_segment",
    "analyze_audio_service",
    "detect_silence_service",
    "segment_by_energy_service",
    "load_audio_service",
    "detect_audio_silence_segments",
    "segment_audio_by_energy_peaks",
    "analyze_audio_spectral_stats",
]
