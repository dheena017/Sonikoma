"""
backend/app/schemas/project.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for comic projects, storyboards, and panel items.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Literal


# =============================================================================
# 1. Project & Panel Management
# =============================================================================

class ProjectCreateRequest(BaseModel):
    """Creates a new comic-to-video project."""
    project_id: str = Field(..., description="Unique Project ID")
    project_type: Optional[Literal["temp", "permanent"]] = Field("permanent", description="Project lifecycle state")
    job_id: Optional[str] = Field(None, description="Workspace Job ID")
    url: str = Field(..., description="Original Webtoon episode URL")
    title: Optional[str] = Field("Untitled Webtoon")
    genre: Optional[str] = Field("general")
    episode: Optional[str] = Field("")
    panels_count: Optional[int] = Field(0)
    video_url: Optional[str] = Field(None)
    author: Optional[str] = Field(None)
    cover_image: Optional[str] = Field(None)
    synopsis: Optional[str] = Field(None)


class PanelSaveItem(BaseModel):
    """Represents an individual storyboard panel (dialogue, motion, narrative, speech text, filters)."""
    image_url: Optional[str] = Field("")
    original_image_url: Optional[str] = Field(None, alias="original_url")
    speech_text: Optional[str] = Field("")
    sfx: Optional[str] = Field("")
    duration: Optional[float] = Field(0.0)
    motion_type: Optional[str] = Field("")
    visual_description: Optional[str] = Field(None)
    narrative: Optional[str] = Field(None, description="Narrative text for the panel")
    brightness: Optional[float] = Field(None)
    contrast: Optional[float] = Field(None)
    saturation: Optional[float] = Field(None)
    grayscale: Optional[bool] = Field(False)
    filter_preset: Optional[str] = Field(None)
    bubble_method: Optional[str] = Field(None)
    bubble_sensitivity: Optional[float] = Field(None)
    bubble_dilation: Optional[float] = Field(None)
    inpaint_radius: Optional[int] = Field(None)
    detection_style: Optional[str] = Field(None)

    class Config:
        populate_by_name = True


class PanelsSaveRequest(BaseModel):
    """Saves or updates a list of project panels."""
    panels: List[PanelSaveItem] = Field(..., description="Curated panel items list")


class ProjectUpdateRequest(BaseModel):
    """Modifies existing project settings, audio parameters, or metadata."""
    job_id: Optional[str] = Field(None, description="Workspace Job ID")
    project_type: Optional[Literal["temp", "permanent"]] = Field(None, description="Project lifecycle state")
    url: Optional[str] = Field(None, description="Original Webtoon episode URL")
    title: Optional[str] = Field(None, description="Series Title")
    genre: Optional[str] = Field(None, description="Series Genre")
    episode: Optional[str] = Field(None, description="Chapter/Episode Number")
    author: Optional[str] = Field(None, description="Series Author")
    cover_image: Optional[str] = Field(None, description="Series Cover Image URL")
    synopsis: Optional[str] = Field(None, description="Series Synopsis")
    video_url: Optional[str] = Field(None, description="Video output URL")
    status: Optional[str] = Field(None, description="Project compilation status")
    panels: Optional[List[PanelSaveItem]] = Field(None, description="Storyboard panels list")
    audio_settings: Optional[Dict[str, Any]] = Field(None, description="Audio settings JSON object (volumes, pitch, rate, BGM, ducking, etc.)")
    video_settings: Optional[Dict[str, Any]] = Field(None, description="Video and canvas settings (aspect ratio, FPS, camera shake, etc.)")
    autocrop_settings: Optional[Dict[str, Any]] = Field(None, description="Auto-crop and panel slicing settings (sensitivity, padding, canny, etc.)")


class ProjectSettingsUpdateRequest(BaseModel):
    """Updates only the centralized project settings (video, audio, autocrop)."""
    video_settings: Optional[Dict[str, Any]] = Field(None, description="Video and canvas settings")
    audio_settings: Optional[Dict[str, Any]] = Field(None, description="Audio and narration settings")
    autocrop_settings: Optional[Dict[str, Any]] = Field(None, description="Auto-crop and panel slicing parameters")


class VideoSettingsUpdateRequest(BaseModel):
    """Updates only the video and canvas rendering settings."""
    video_settings: Optional[Dict[str, Any]] = Field(None, description="Video configuration payload")
    # Also allow direct properties at root of payload if passed directly
    aspectRatio: Optional[str] = Field(None, description="Aspect ratio (e.g. 16:9, 9:16)")
    frameRate: Optional[int] = Field(None, description="Target frame rate (fps)")
    audioReactiveShake: Optional[bool] = Field(None, description="Camera shake reactive to audio")
    shakeIntensity: Optional[Any] = Field(None, description="Camera shake intensity")
    videoFormat: Optional[str] = Field(None, description="Target video format (mp4, webm, etc.)")
    backgroundStyle: Optional[str] = Field(None, description="Background fill style")
    subtitlesStyle: Optional[str] = Field(None, description="Subtitles typography style")
    activeTheme: Optional[str] = Field(None, description="Color palette theme")


class AudioSettingsUpdateRequest(BaseModel):
    """Updates only the audio synthesis and playback settings."""
    audio_settings: Optional[Dict[str, Any]] = Field(None, description="Audio configuration payload")
    # Also allow direct properties at root of payload if passed directly
    volume: Optional[float] = Field(None, description="Master volume (0-100)")
    narrationVolume: Optional[float] = Field(None, description="Narration/TTS volume (0-100)")
    bgmVolume: Optional[float] = Field(None, description="Background music volume (0-100)")
    sfxVolume: Optional[float] = Field(None, description="Sound effects volume (0-100)")
    speechRate: Optional[float] = Field(None, description="Speech rate speed factor")
    speechPitch: Optional[float] = Field(None, description="Speech pitch factor")
    voiceActor: Optional[str] = Field(None, description="Selected TTS voice identifier")
    narratorVoice: Optional[str] = Field(None, description="Selected chapter narrator voice")
    musicTheme: Optional[str] = Field(None, description="Background music theme")
    audioDucking: Optional[bool] = Field(None, description="Auto ducking flag")


class AutoCropSettingsUpdateRequest(BaseModel):
    """Updates only the auto-crop panel slicing parameters."""
    autocrop_settings: Optional[Dict[str, Any]] = Field(None, description="AutoCrop configuration payload")
    # Also allow direct properties at root of payload if passed directly
    sensitivity: Optional[int] = Field(None, description="Detection sensitivity threshold")
    padding: Optional[int] = Field(None, description="Panel margin padding in pixels")
    backgroundColorMode: Optional[str] = Field(None, description="Background color removal mode")
    autoSplitTallStrips: Optional[bool] = Field(None, description="Auto-split tall webtoon strips")
    aspectRatioLock: Optional[str] = Field(None, description="Aspect ratio locking rule")
    minPanelAreaPct: Optional[float] = Field(None, description="Minimum panel surface area percentage")
    overlapMergeThreshold: Optional[float] = Field(None, description="Overlap merging threshold")
    useLocalCV: Optional[bool] = Field(None, description="Use local OpenCV engine")
    cropModel: Optional[str] = Field(None, description="Model for panel detection")
    cropMinHeightPx: Optional[int] = Field(None, description="Minimum panel height in pixels")
    cropCannyLow: Optional[int] = Field(None, description="Canny edge low threshold")
    cropCannyHigh: Optional[int] = Field(None, description="Canny edge high threshold")
    cropCloseKernelSize: Optional[int] = Field(None, description="Morphological close kernel size")


class TokenIncrementRequest(BaseModel):
    """Tracks token consumption for a project."""
    tokens: int = Field(..., description="Number of tokens to add")
    job_id: Optional[str] = Field(None, description="Workspace Job ID for attribution")


class BatchDeleteRequest(BaseModel):
    """Deletes multiple projects by ID."""
    project_ids: List[str] = Field(..., description="List of Project IDs to delete")


class DetectPanelsBase64Request(BaseModel):
    """Panel detection parameters for base64 image streams."""
    image_base64: str = Field(..., description="Base64-encoded source image")
    sensitivity: float = Field(30.0, ge=0.0, le=100.0)
    background_mode: Literal["auto", "white", "black"] = "auto"
    min_width_pct: float = Field(0.15, ge=0.0, le=1.0)
    min_height_px: int = Field(60, ge=1)
    merge_threshold: int = Field(20, ge=0)
    aspect_ratio: Literal["free", "1:1", "16:9", "9:16", "4:3"] = "free"
    canny_low: int = Field(20, ge=0, le=255)
    canny_high: int = Field(100, ge=0, le=255)
    close_kernel_size: int = Field(15, ge=1, le=99)
    auto_split: bool = Field(True, description="Automatically split tall strips at gutters")


class PanelBoundingBox(BaseModel):
    """Detected comic panel bounding box coordinates."""
    x: int = Field(..., description="X pixel coordinate")
    y: int = Field(..., description="Y pixel coordinate")
    w: int = Field(..., description="Width in pixels")
    h: int = Field(..., description="Height in pixels")
    confidence: Optional[float] = Field(1.0, description="Detection confidence score")
    label: Optional[str] = Field("panel", description="Detected entity label")
    type: Optional[str] = Field("panel", description="Entity type: panel, bubble, character")


class PanelDetectionResponse(BaseModel):
    """Result of comic panel and bubble detection."""
    success: bool
    panels: List[PanelBoundingBox] = []
    count: int = 0
    message: Optional[str] = None
