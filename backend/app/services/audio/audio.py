"""
Service layer for orchestrating audio generation.

Coordinates between the business logic and the Text-To-Speech (TTS) engine layer
to convert narrative and dialogue scripts into physical audio assets.
"""

from .tts import sanitize_text_for_tts, generate_segment_with_retry, generate_panel_audio
from .transcription import generate_srt, generate_vtt, extract_words_with_timestamps, generate_json_transcript, batch_transcribe
from .processing import detect_silence, segment_by_energy, extract_summary_stats, save_audio_segment

__all__ = [
    'sanitize_text_for_tts',
    'generate_segment_with_retry',
    'generate_panel_audio',
    'generate_srt',
    'generate_vtt',
    'extract_words_with_timestamps',
    'generate_json_transcript',
    'batch_transcribe',
    'detect_silence',
    'segment_by_energy',
    'extract_summary_stats',
    'save_audio_segment'
]
