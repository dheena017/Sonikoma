"""
backend/features/video/operations/__init__.py
─────────────────────────────────────────────────────────────────────────────
Atomic FFmpeg operations facade: cutting, concatenation, filters, speed, audio.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.operations.cutter_service import (
    cut_video,
    cut_video_clip,
)
from features.video.operations.concat_service import (
    concat_videos,
    concatenate_video_clips,
)
from features.video.operations.filter_service import (
    apply_filter,
    apply_video_filter,
)
from features.video.operations.speed_service import (
    change_speed,
    adjust_video_speed,
)
from features.video.operations.audio_merge_service import (
    extract_audio,
    mix_audio,
    extract_audio_from_video,
    mix_audio_into_video,
)
from features.video.operations.subtitle_burn_service import (
    burn_subtitles,
    burn_subtitles_into_video,
)
from features.video.operations.thumbnail_service import (
    get_thumbnail,
    extract_video_thumbnail,
)
from features.video.operations.probe_service import (
    get_video_info,
    probe_video_metadata,
)

__all__ = [
    "cut_video",
    "cut_video_clip",
    "concat_videos",
    "concatenate_video_clips",
    "apply_filter",
    "apply_video_filter",
    "change_speed",
    "adjust_video_speed",
    "extract_audio",
    "mix_audio",
    "extract_audio_from_video",
    "mix_audio_into_video",
    "burn_subtitles",
    "burn_subtitles_into_video",
    "get_thumbnail",
    "extract_video_thumbnail",
    "get_video_info",
    "probe_video_metadata",
]
