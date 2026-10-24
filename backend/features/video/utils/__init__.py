"""
backend/features/video/utils/__init__.py
─────────────────────────────────────────────────────────────────────────────
Foundational utilities facade for video dimension, timecode, and media handling.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.utils.resolutions import (
    STANDARD_RESOLUTIONS,
    make_even_dimensions,
    get_resolution,
    get_bitrate,
    ensure_even_dimensions,
    resolve_resolution,
    calculate_video_bitrate,
)
from features.video.utils.timecodes import (
    DEFAULT_FPS,
    DEFAULT_FRAME_DURATION,
    CinematicMotionType,
    VALID_MOTIONS,
    get_total_frames,
    format_timecode,
    parse_timecode,
    calculate_total_frames,
    parse_timecode_to_seconds,
)
from features.video.utils.media_resolver import (
    MEDIA_VIDEOS_DIR,
    TEMP_DIR,
    MEDIA_DIR,
    load_image,
    get_output_path,
    resolve_video_input_image,
    get_video_output_path,
)

__all__ = [
    "STANDARD_RESOLUTIONS",
    "make_even_dimensions",
    "get_resolution",
    "get_bitrate",
    "ensure_even_dimensions",
    "resolve_resolution",
    "calculate_video_bitrate",
    "DEFAULT_FPS",
    "DEFAULT_FRAME_DURATION",
    "CinematicMotionType",
    "VALID_MOTIONS",
    "get_total_frames",
    "format_timecode",
    "parse_timecode",
    "calculate_total_frames",
    "parse_timecode_to_seconds",
    "MEDIA_VIDEOS_DIR",
    "TEMP_DIR",
    "MEDIA_DIR",
    "load_image",
    "get_output_path",
    "resolve_video_input_image",
    "get_video_output_path",
]
