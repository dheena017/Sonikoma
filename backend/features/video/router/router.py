"""
backend/features/video/router/router.py
─────────────────────────────────────────────────────────────────────────────
Unified Video APIRouter mounting modular route handlers:
- /render, /stream: Render compilation and video streaming
- /cut, /concatenate, /filter, /speed: Video clip operations
- /extract-audio, /mix-audio: Audio-video operations
- /subtitles: Subtitle burning
- /metadata: Technical container inspection
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.video.router.render import router as render_router
from features.video.router.clip import router as clip_router
from features.video.router.audio import router as audio_router
from features.video.router.subtitles import router as subtitles_router
from features.video.router.metadata import router as metadata_router

router = APIRouter()

# Mount render and streaming endpoints at root of video router
router.include_router(render_router, tags=["Video: Rendering & Stream"])

# Mount atomic operations
router.include_router(clip_router, tags=["Video: Clip Operations"])
router.include_router(audio_router, tags=["Video: Audio Operations"])
router.include_router(subtitles_router, prefix="/subtitles", tags=["Video: Subtitles"])
router.include_router(metadata_router, tags=["Video: Inspection"])

# Backward compatibility aliases
video_router = router
ffmpeg_router = router

__all__ = [
    "router",
    "video_router",
    "ffmpeg_router",
]
