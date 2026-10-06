"""
backend/app/providers/video/__init__.py
─────────────────────────────────────────────────────────────────────────────
Video rendering, motion, and subtitle engine package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.video.types import (
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
from ai_engine.providers.video.helpers import (
    get_ffmpeg_filter_string,
    format_duration,
)
from ai_engine.providers.video.client import VideoClient
from ai_engine.providers.video.engine import VideoEngine, get_video_engine

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
