"""
backend/app/providers/video/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video rendering, motion, and subtitle engine package.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.video.types import (
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
from app.providers.video.helpers import (
    get_ffmpeg_filter_string,
    format_duration,
)
from app.providers.video.client import VideoClient
from app.providers.video.engine import VideoEngine, get_video_engine

__all__ = [
    # Types
    "TransitionType",
    "FilterType",
    "VideoMetadata",
    "TransitionSpec",
    "CutSpec",
    # Helpers
    "get_ffmpeg_filter_string",
    "format_duration",
    # Client & Engine
    "VideoClient",
    "VideoEngine",
    "get_video_engine",
]
