"""
backend/app/providers/ffmpeg/__init__.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg media processing provider package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.ffmpeg.types import (
    FilterType,
    TransitionType,
    VideoMetadata,
    TransitionSpec,
    CutSpec,
)
from ai_engine.providers.ffmpeg.helpers import (
    get_ffmpeg_filter_string,
    build_ffprobe_cmd,
    build_extract_frames_cmd,
    build_extract_audio_cmd,
    build_concatenate_videos_cmd,
    build_cut_video_cmd,
    build_adjust_speed_cmd,
    build_apply_filter_cmd,
    build_add_subtitles_cmd,
    build_mix_audio_cmd,
)
from ai_engine.providers.ffmpeg.client import FFmpegClient
from ai_engine.providers.ffmpeg.engine import FFmpegEngine, get_ffmpeg_engine

__all__ = [
    # Types
    "FilterType",
    "TransitionType",
    "VideoMetadata",
    "TransitionSpec",
    "CutSpec",
    # Helpers
    "get_ffmpeg_filter_string",
    "build_ffprobe_cmd",
    "build_extract_frames_cmd",
    "build_extract_audio_cmd",
    "build_concatenate_videos_cmd",
    "build_cut_video_cmd",
    "build_adjust_speed_cmd",
    "build_apply_filter_cmd",
    "build_add_subtitles_cmd",
    "build_mix_audio_cmd",
    # Client & Engine
    "FFmpegClient",
    "FFmpegEngine",
    "get_ffmpeg_engine",
]
