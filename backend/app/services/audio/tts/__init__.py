"""
backend/app/services/audio/tts/__init__.py
─────────────────────────────────────────────────────────────────────────────
Text-to-Speech (TTS) audio synthesis services package.
─────────────────────────────────────────────────────────────────────────────
"""

from services.audio.tts.tts_engine import (
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

__all__ = [
    "generate_panel_audio",
    "generate_tts_audio",
    "get_available_voices",
    "sanitize_text_for_tts",
    "generate_segment_with_retry",
    "synthesize_panel_narration_audio",
    "synthesize_dialogue_to_speech",
    "get_supported_voice_list",
    "VOICE_MAP",
]
