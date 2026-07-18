"""
backend/app/engines/video/types.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatible proxy re-exporting symbols from ffmpeg_types.py.
─────────────────────────────────────────────────────────────────────────────
"""

from engines.video.ffmpeg_types import (  # noqa: F401
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
