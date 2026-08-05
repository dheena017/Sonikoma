"""
backend/app/services/audio/audio_service.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy.
Re-exports audio, TTS, and transcription services.
─────────────────────────────────────────────────────────────────────────────
"""

from services.audio.tts_engine import *
from services.audio.speech_transcriber import *
from services.audio.audio_processor import *
from services.audio.dialogue_aligner import *
