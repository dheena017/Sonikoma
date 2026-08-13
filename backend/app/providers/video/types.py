"""
backend/app/engines/video/types.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatible proxy re-exporting symbols from ffmpeg_types.py.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.ffmpeg.types import (  # noqa: F401
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
