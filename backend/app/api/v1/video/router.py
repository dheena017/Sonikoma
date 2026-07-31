"""
backend/app/api/v1/video/router.py
─────────────────────────────────────────────────────────────────────────────
Main entry router for video and ffmpeg endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter
from api.v1.video.render import router as render_router

video_router = APIRouter()
video_router.include_router(render_router)

# Some parts of the codebase expect an ffmpeg_router to exist.
# Current implementation does not define ffmpeg routes, so we provide an empty router
# to keep imports and app boot from failing.
ffmpeg_router = APIRouter()

