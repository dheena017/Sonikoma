"""
backend/app/api/v1/video/router.py
─────────────────────────────────────────────────────────────────────────────
Main entry router for video and ffmpeg endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter
from api.v1.video.render import router as render_router
from api.v1.video.ffmpeg import router as ffmpeg_router  # re-exported for api/router.py

video_router = APIRouter()
video_router.include_router(render_router)
