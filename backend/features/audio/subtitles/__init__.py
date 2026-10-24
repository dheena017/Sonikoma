"""
backend/features/audio/subtitles/__init__.py
─────────────────────────────────────────────────────────────────────────────
Speech-to-text transcription and subtitle export sub-domain facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.audio.subtitles.speech_to_text_service import turn_speech_into_text
from features.audio.subtitles.srt_subtitles_service import make_srt_subtitles
from features.audio.subtitles.vtt_subtitles_service import make_vtt_subtitles
from features.audio.subtitles.word_timer_service import get_word_times
from features.audio.subtitles.batch_transcribe_service import turn_many_files_into_text

__all__ = [
    "turn_speech_into_text",
    "make_srt_subtitles",
    "make_vtt_subtitles",
    "get_word_times",
    "turn_many_files_into_text",
]
