"""
backend/app/services/audio/alignment_service.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy.
Re-exports alignment services from `services.audio.dialogue_aligner`.
─────────────────────────────────────────────────────────────────────────────
"""

from services.audio.dialogue_aligner import *
from services.audio.speech_transcriber import *
from services.audio.audio_processor import *
