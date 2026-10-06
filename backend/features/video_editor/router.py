"""
backend/app/features/video_editor/router.py
─────────────────────────────────────────────────────────────────────────────
Unified router for the Video Editor domain.
Combines sub-domains:
  - /video: FFmpeg video rendering, timeline synthesis, Ken Burns pan/zoom, transitions
  - /audio: TTS voiceover synthesis, sound FX mixing, audio analysis, subtitle generation
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.video_editor.video.router import video_router
from features.video_editor.audio import audio_router

router = APIRouter(prefix="/video-editor", tags=["Video Editor"])

router.include_router(video_router, prefix="/video", tags=["Video Editor: Render"])
router.include_router(audio_router, prefix="/audio", tags=["Video Editor: Audio & TTS"])
