"""
backend/app/engines/video/ffmpeg_types.py
─────────────────────────────────────────────────────────────────────────────
Video and FFmpeg processing specifications: enums and metadata dataclasses.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional


class TransitionType(str, Enum):
    """Supported FFmpeg transitions."""
    FADE = "fade"
    DISSOLVE = "dissolve"
    SLIDE_LEFT = "slideleft"
    SLIDE_RIGHT = "slideright"
    SLIDE_UP = "slideup"
    SLIDE_DOWN = "slidedown"
    WIPE = "wipeleft"
    ZOOM_IN = "zoomin"
    ZOOM_OUT = "zoomout"


class FilterType(str, Enum):
    """Supported FFmpeg filters."""
    BLUR = "blur"
    BRIGHTEN = "brighten"
    DARKEN = "darken"
    SATURATE = "saturate"
    DESATURATE = "desaturate"
    GRAYSCALE = "grayscale"
    SEPIA = "sepia"
    INVERT = "invert"
    SHARPEN = "sharpen"
    DENOISE = "denoise"


@dataclass
class VideoMetadata:
    """Video file metadata."""
    duration: float
    width: int
    height: int
    fps: float
    bitrate: str
    codec: str
    has_audio: bool
    audio_bitrate: Optional[str] = None
    sample_rate: Optional[int] = None


@dataclass
class TransitionSpec:
    """Video transition specification."""
    type: TransitionType
    duration: float = 1.0
    start_frame: Optional[int] = None


@dataclass
class CutSpec:
    """Video cut/trim specification."""
    start_time: float
    end_time: float
    fade_in: float = 0.0
    fade_out: float = 0.0
