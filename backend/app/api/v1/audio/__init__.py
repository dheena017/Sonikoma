
"""
backend/app/api/v1/audio/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio API package — assembles all audio sub-routers into a single
`audio_router` that the main api/router.py mounts at /api/v1/audio.

Sub-modules:
  settings.py      – GET/POST /settings, GET /presets
  tts.py           – POST /tts, GET /voices, POST /preview
  mixer.py         – POST /mix
  alignment.py     – POST /align/{panel_id}
  analysis.py      – POST /analyze, POST /silence, POST /segments
  transcription.py – POST /transcribe, POST /transcribe/batch,
                     POST /subtitles/srt, POST /subtitles/vtt,
                     POST /timestamps
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from api.v1.audio.settings import router as settings_router
from api.v1.audio.tts import router as tts_router
from api.v1.audio.mixer import router as mixer_router
from api.v1.audio.alignment import router as alignment_router
from api.v1.audio.analysis import router as analysis_router
from api.v1.audio.transcription import router as transcription_router

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

# Backward-compat alias (some internal imports reference `router`)
router = audio_router

__all__ = ["audio_router", "router"]
