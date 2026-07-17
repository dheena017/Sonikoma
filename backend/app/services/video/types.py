"""
backend/app/services/video/types.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatible proxy re-exporting symbols from ffmpeg_types.py.
─────────────────────────────────────────────────────────────────────────────
"""

from services.video.ffmpeg_types import (
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec
)
