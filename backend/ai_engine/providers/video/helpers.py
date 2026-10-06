"""
backend/app/providers/video/helpers.py
─────────────────────────────────────────────────────────────────────────────
Video utility helpers: duration formatting and FFmpeg filter string lookup.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.ffmpeg.helpers import get_ffmpeg_filter_string
from ai_engine.providers.ffmpeg.types import FilterType


def format_duration(seconds: float) -> str:
    """Format total seconds into MM:SS display string."""
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


__all__ = [
    "get_ffmpeg_filter_string",
    "format_duration",
    "FilterType",
]
