"""
backend/app/schemas/video.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for video timeline, rendering, and FFmpeg operations.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from app.providers.ffmpeg import FilterType


# =============================================================================
# 1. Timeline & Rendering Structure
# =============================================================================

class PanelLayersData(BaseModel):
    """Layer positioning and parallax settings for multi-layer panels."""
    background_url: str
    character_url: str
    text_url: str
    char_x: Optional[float] = 0.0
    char_y: Optional[float] = 0.0
    char_scale_x: Optional[float] = 1.0
    char_scale_y: Optional[float] = 1.0
    text_x: Optional[float] = 0.0
    text_y: Optional[float] = 0.0
    text_scale_x: Optional[float] = 1.0
    text_scale_y: Optional[float] = 1.0
    parallax_intensity: Optional[float] = 30.0


class DialogueSegmentData(BaseModel):
    """Start and end timestamps for dialogue segments."""
    start_time: float
    end_time: float


class PanelSyncMapData(BaseModel):
    """Maps dialogue segments and audio peaks to a panel."""
    dialogue_map: List[DialogueSegmentData]
    audio_peaks: Optional[List[float]] = None


class PanelData(BaseModel):
    """Complete panel timeline item (image, audio, motion, shake, layers, duration)."""
    id: int
    image_url: str
    duration: float = 3.0
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None
    motion_type: Optional[str] = None
    layers: Optional[PanelLayersData] = None
    syncMap: Optional[PanelSyncMapData] = None
    audio_reactive_shake: Optional[bool] = False


class RenderRequest(BaseModel):
    """Full project video rendering request (aspect ratio, volumes, subtitles, transitions)."""
    project_id: Optional[str] = Field(None, description="Project ID")
    panels: List[PanelData]
    voice: Optional[str] = "en-US-GuyNeural"
    music_theme: Optional[str] = "none"          # "none" | "action" | "adventure" | etc.
    aspect_ratio: Optional[str] = "auto"          # "auto" | "9:16" | "16:9"
    frame_rate: Optional[int] = 24
    video_format: Optional[str] = "mp4"           # "mp4" | "webm" | "mkv"
    background_style: Optional[str] = "black"     # "black" | "white" | "blurred"
    subtitles_style: Optional[str] = "none"       # "none" | "burn-in"
    audio_reactive_shake: Optional[bool] = False
    shake_intensity: Optional[str] = "medium"     # "low" | "medium" | "high" | "extreme"
    master_volume: Optional[float] = 1.0          # 0.0 to 1.0
    narration_volume: Optional[float] = 1.0       # 0.0 to 1.0
    bgm_volume: Optional[float] = 1.0             # 0.0 to 1.0
    speech_rate: Optional[float] = 1.0            # Speed factor
    speech_pitch: Optional[float] = 1.0           # Pitch factor


# =============================================================================
# 2. FFmpeg Video Operations
# =============================================================================

class MetadataRequest(BaseModel):
    """Retrieves video file metadata."""
    video_path: str


class CutSpecRequest(BaseModel):
    """Defines cut start/end points and fade settings."""
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., gt=0.0)
    fade_in: Optional[float] = 0.0
    fade_out: Optional[float] = 0.0


class CutVideoRequest(BaseModel):
    """Executes video cuts."""
    video_path: str
    cuts: List[CutSpecRequest]
    output_path: Optional[str] = None


class ExtractAudioRequest(BaseModel):
    """Extracts audio tracks from video files."""
    video_path: str
    output_path: Optional[str] = None
    format: Optional[str] = "mp3"
    bitrate: Optional[str] = "192k"


class MixAudioRequest(BaseModel):
    """Mixes multiple audio tracks into a video."""
    video_path: str
    audio_paths: List[str]
    audio_volumes: Optional[List[float]] = None
    output_path: Optional[str] = None


class SubtitlesRequest(BaseModel):
    """Burns subtitles into a video file."""
    video_path: str
    subtitle_path: str
    output_path: Optional[str] = None


class ApplyFilterRequest(BaseModel):
    """Applies FFmpeg visual filters to video."""
    video_path: str
    filter_type: FilterType
    intensity: Optional[float] = 1.0
    output_path: Optional[str] = None


class AdjustSpeedRequest(BaseModel):
    """Adjusts video playback speed while preserving audio pitch."""
    video_path: str
    speed_factor: float = Field(..., gt=0.0)
    preserve_pitch: Optional[bool] = True
    output_path: Optional[str] = None


class ConcatenateVideosRequest(BaseModel):
    """Merges multiple video files."""
    video_paths: List[str]
    output_path: Optional[str] = None
    fps: Optional[int] = 24
    width: Optional[int] = 1920
    height: Optional[int] = 1080


class TransitionSpecRequest(BaseModel):
    """Defines transition types and durations."""
    type: str
    duration: Optional[float] = 1.0
    start_frame: Optional[int] = None


class ConcatenateWithTransitionsRequest(BaseModel):
    """Merges multiple video clips with custom visual transitions."""
    video_paths: List[str]
    transitions: Optional[List[TransitionSpecRequest]] = None
    output_path: Optional[str] = None
    fps: Optional[int] = 24
    width: Optional[int] = 1920
    height: Optional[int] = 1080
