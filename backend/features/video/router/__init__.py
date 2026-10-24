"""
backend/features/video/router/__init__.py
─────────────────────────────────────────────────────────────────────────────
Modular video router sub-package exporting unified router instance.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.router.router import router, video_router, ffmpeg_router

__all__ = [
    "router",
    "video_router",
    "ffmpeg_router",
]
