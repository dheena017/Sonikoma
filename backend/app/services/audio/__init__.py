"""
backend/app/services/audio/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified package entry point for all Sonikoma Audio Services.
Exposes TTS synthesis, speech transcription, dialogue alignment, and Librosa
audio signal processing.
─────────────────────────────────────────────────────────────────────────────
"""

# 1. Text-to-Speech (TTS) Synthesis
from services.audio.tts import (
    generate_panel_audio,
    generate_tts_audio,
    get_available_voices,
    sanitize_text_for_tts,
    generate_segment_with_retry,
    synthesize_panel_narration_audio,
    synthesize_dialogue_to_speech,
    get_supported_voice_list,
    VOICE_MAP,
)

# 2. Speech Transcription & Subtitle Generation
from services.audio.transcription import (
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

# 3. Dialogue Alignment & Audio Peak Extraction
from services.audio.alignment import (
    align_dialogue_and_extract_peaks,
    align_dialogue_service,
    align_dialogue_with_audio_timestamps,
)

# 4. Audio Signal Processing & Spectral Statistics
from services.audio.processing import (
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
    "get_available_voices",
    "sanitize_text_for_tts",
    "generate_segment_with_retry",
    "synthesize_panel_narration_audio",
    "synthesize_dialogue_to_speech",
    "get_supported_voice_list",
    "VOICE_MAP",
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
