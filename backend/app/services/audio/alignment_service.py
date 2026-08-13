"""
backend/app/services/audio/alignment_service.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy.
Re-exports alignment services from `services.audio.alignment`,
`services.audio.transcription`, and `services.audio.processing`.
─────────────────────────────────────────────────────────────────────────────
"""

from services.audio.alignment import *
from services.audio.transcription import *
from services.audio.processing import *
