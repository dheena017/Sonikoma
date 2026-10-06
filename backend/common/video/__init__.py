"""
backend/common/video/__init__.py
─────────────────────────────────────────────────────────────────────────────
Common Video Domain Primitives:
- resolutions: Standard resolution maps, dimension resolution, encoder even-dimension enforcement
- motion: Cinematic motion enums, frame count arithmetic, SMPTE timecodes
─────────────────────────────────────────────────────────────────────────────
"""

from .resolutions import (
    STANDARD_RESOLUTIONS,
    resolve_resolution,
    ensure_even_dimensions,
    calculate_video_bitrate,
)
from .motion import (
    CinematicMotionType,
    VALID_MOTIONS,
    DEFAULT_FPS,
    DEFAULT_FRAME_DURATION,
    calculate_total_frames,
    format_timecode,
)

__all__ = [
    # Resolutions
    "STANDARD_RESOLUTIONS",
    "resolve_resolution",
    "ensure_even_dimensions",
    "calculate_video_bitrate",
    # Motion & Timing
    "CinematicMotionType",
    "VALID_MOTIONS",
    "DEFAULT_FPS",
    "DEFAULT_FRAME_DURATION",
    "calculate_total_frames",
    "format_timecode",
]
