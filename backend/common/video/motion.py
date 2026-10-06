"""
backend/common/video/motion.py
─────────────────────────────────────────────────────────────────────────────
Cinematic camera motion models, timecodes, and frame timeline calculations.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import Union, List


class CinematicMotionType(str, Enum):
    """Supported 2D cinematic camera movement presets."""
    ZOOM_IN = "zoom_in"
    ZOOM_OUT = "zoom_out"
    PAN_LEFT = "pan_left"
    PAN_RIGHT = "pan_right"
    PAN_UP = "pan_up"
    PAN_DOWN = "pan_down"
    STATIC = "static"
    FADE = "fade"
    CAMERA_SHAKE = "camera_shake"


VALID_MOTIONS: List[str] = [m.value for m in CinematicMotionType]
DEFAULT_FPS: int = 30
DEFAULT_FRAME_DURATION: float = 3.0


def calculate_total_frames(duration_seconds: Union[int, float], fps: int = DEFAULT_FPS) -> int:
    """Calculates total frame count from duration in seconds and frame rate."""
    if duration_seconds is None or duration_seconds <= 0:
        return 0
    return int(round(float(duration_seconds) * fps))


def format_timecode(seconds: Union[int, float], fps: int = DEFAULT_FPS) -> str:
    """
    Formats seconds into standard SMPTE timecode string 'HH:MM:SS:FF'.
    """
    if seconds is None or seconds < 0:
        return "00:00:00:00"

    total_frames = calculate_total_frames(seconds, fps)
    frames = total_frames % fps
    total_seconds = int(seconds)
    secs = total_seconds % 60
    minutes = (total_seconds // 60) % 60
    hours = total_seconds // 3600

    return f"{hours:02d}:{minutes:02d}:{secs:02d}:{frames:02d}"


__all__ = [
    "CinematicMotionType",
    "VALID_MOTIONS",
    "DEFAULT_FPS",
    "DEFAULT_FRAME_DURATION",
    "calculate_total_frames",
    "format_timecode",
]
