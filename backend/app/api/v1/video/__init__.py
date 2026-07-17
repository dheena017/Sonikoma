"""
backend/app/api/v1/video/__init__.py
Re-exports routers for the video package.
"""

from api.v1.video.router import video_router, ffmpeg_router

__all__ = ["video_router", "ffmpeg_router"]

