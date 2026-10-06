"""
backend/features/video_editor/audio/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio sub-domain router package.
Assembles all audio sub-routers into unified `audio_router`.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.video_editor.audio.router.settings import router as settings_router
from features.video_editor.audio.router.tts import router as tts_router
from features.video_editor.audio.router.mixer import router as mixer_router
from features.video_editor.audio.router.alignment import router as alignment_router
from features.video_editor.audio.router.analysis import router as analysis_router
from features.video_editor.audio.router.transcription import router as transcription_router

audio_router = APIRouter()

# ── Section 0: Configuration & Presets ───────────────────────────────────────
audio_router.include_router(settings_router)

# ── Section 1: TTS Synthesis & Voice Audition ────────────────────────────────
audio_router.include_router(tts_router)

# ── Section 2: Audio Mixing & BGM ────────────────────────────────────────────
audio_router.include_router(mixer_router)

# ── Section 3: Dialogue & Waveform Alignment ─────────────────────────────────
audio_router.include_router(alignment_router)

# ── Section 4: Audio Signal Analysis & Segmentation ──────────────────────────
audio_router.include_router(analysis_router)

# ── Section 5: Whisper STT Transcription & Subtitles ─────────────────────────
audio_router.include_router(transcription_router)

router = audio_router

__all__ = [
    "audio_router",
    "router",
    "settings_router",
    "tts_router",
    "mixer_router",
    "alignment_router",
    "analysis_router",
    "transcription_router",
]
