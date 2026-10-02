"""
backend/app/providers/video/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, schemas, and specifications for video compilation.
─────────────────────────────────────────────────────────────────────────────
"""

from app.providers.ffmpeg.types import (  # noqa: F401
    TransitionType,
    FilterType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
