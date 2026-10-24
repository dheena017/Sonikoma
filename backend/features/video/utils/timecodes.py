"""
backend/features/video/utils/timecodes.py
─────────────────────────────────────────────────────────────────────────────
SMPTE timecode formatting, frame calculations, and playback time parsing.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Union
from enum import Enum

DEFAULT_FPS: int = 30
DEFAULT_FRAME_DURATION: float = 3.0


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


VALID_MOTIONS = [m.value for m in CinematicMotionType]


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _split_timecode_components(timecode: str) -> tuple[int, int, int, int]:
    """Parses HH:MM:SS:FF or HH:MM:SS string components."""
    parts = timecode.strip().split(":")
    if len(parts) == 4:
        return int(parts[0]), int(parts[1]), int(parts[2]), int(parts[3])
    elif len(parts) == 3:
        return int(parts[0]), int(parts[1]), int(parts[2]), 0
    elif len(parts) == 2:
        return 0, int(parts[0]), int(parts[1]), 0
    raise ValueError(f"Invalid timecode format: '{timecode}'")


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def get_total_frames(
    duration_seconds: Union[int, float],
    fps: int = DEFAULT_FPS
) -> int:
    """Calculates total frame count from duration in seconds and frame rate."""
    if duration_seconds is None or duration_seconds <= 0:
        return 0
    return int(round(float(duration_seconds) * fps))


def format_timecode(
    seconds: Union[int, float],
    fps: int = DEFAULT_FPS
) -> str:
    """Formats seconds into standard SMPTE timecode string 'HH:MM:SS:FF'."""
    if seconds is None or seconds < 0:
        return "00:00:00:00"

    total_frames = get_total_frames(seconds, fps)
    frames = total_frames % fps
    total_seconds = int(seconds)
    secs = total_seconds % 60
    minutes = (total_seconds // 60) % 60
    hours = total_seconds // 3600

    return f"{hours:02d}:{minutes:02d}:{secs:02d}:{frames:02d}"


def parse_timecode(
    timecode: str,
    fps: int = DEFAULT_FPS
) -> float:
    """Parses standard SMPTE timecode 'HH:MM:SS:FF' into float seconds."""
    hours, minutes, seconds, frames = _split_timecode_components(timecode)
    return float(hours * 3600 + minutes * 60 + seconds) + (float(frames) / float(fps))


# Backward compatibility aliases
calculate_total_frames = get_total_frames
parse_timecode_to_seconds = parse_timecode

__all__ = [
    "DEFAULT_FPS",
    "DEFAULT_FRAME_DURATION",
    "CinematicMotionType",
    "VALID_MOTIONS",
    "get_total_frames",
    "format_timecode",
    "parse_timecode",
    "calculate_total_frames",
    "parse_timecode_to_seconds",
]
