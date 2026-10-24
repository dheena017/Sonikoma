"""
backend/features/audio/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio sub-domain main router:
Assembles speech, mixer, subtitles, sync, analysis, and settings routers
into a single unified `audio_router` mounted at `/api/v1/audio`.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.audio.router.settings import router as settings_router
from features.audio.router.speech import router as speech_router
from features.audio.router.mixer import router as mixer_router
from features.audio.router.sync import router as sync_router
from features.audio.router.analysis import router as analysis_router
from features.audio.router.subtitles import router as subtitles_router

audio_router = APIRouter()

# ── Include all sub-routers ──────────────────────────────────────────────────
audio_router.include_router(settings_router)
audio_router.include_router(speech_router)
audio_router.include_router(mixer_router)
audio_router.include_router(sync_router)
audio_router.include_router(analysis_router)
audio_router.include_router(subtitles_router)

router = audio_router

__all__ = [
    "audio_router",
    "router",
    "settings_router",
    "speech_router",
    "mixer_router",
    "sync_router",
    "analysis_router",
    "subtitles_router",
]
