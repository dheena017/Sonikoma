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


from enum import Enum


class EntityCategory(str, Enum):
    PANEL = "panel"
    TEXT = "text"
    CHARACTER = "character"


class EntityLabel(str, Enum):
    PANEL_STANDARD = "panel_standard"
    PANEL_BORDERLESS = "panel_borderless"
    PANEL_SPLASH = "panel_splash"
    PANEL_DIAGONAL = "panel_diagonal"
    PANEL_INSET = "panel_inset"
    BUBBLE_SPEECH = "bubble_speech"
    BUBBLE_SHOUT = "bubble_shout"
    BUBBLE_THOUGHT = "bubble_thought"
    BUBBLE_WHISPER = "bubble_whisper"
    CAPTION_NARRATION = "caption_narration"
    SFX_SOUND_EFFECT = "sfx_sound_effect"
    CHARACTER_BREAKOUT = "character_breakout"
    CHARACTER_FACE = "character_face"


class SpeechBubbleItem(BaseModel):
    """Rich metadata for a single detected speech bubble or dialogue caption."""
    bubble_id: str = Field(..., description="Unique bubble identifier")
    parent_panel_id: Optional[str] = Field(None, description="Bound parent panel ID")
    label: str = Field(EntityLabel.BUBBLE_SPEECH.value, description="Semantic bubble label")
    category: str = Field(EntityCategory.TEXT.value, description="Entity category")
    sub_type: Optional[str] = Field("dialogue_balloon", description="Detailed sub-type")
    x: int = Field(..., description="Top-left X coordinate in pixels")
    y: int = Field(..., description="Top-left Y coordinate in pixels")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")
    polygon: Optional[List[List[int]]] = Field(None, description="Exact polygon contour vertices")
    dialogue_text: Optional[str] = Field(None, description="OCR transcribed dialogue text")
    confidence: float = Field(1.0, description="Detection confidence score")
    reading_order: int = Field(1, description="Reading sequence within panel")
    is_bound: bool = Field(True, description="Whether bubble was bound into panel boundary")


class PanelBoundingBox(BaseModel):
    """Detected comic panel bounding box coordinates with rich metadata."""
    id: Optional[str] = Field(None, description="Panel identifier")
    index: int = Field(0, description="Reading order index")
    x: int = Field(..., description="X pixel coordinate")
    y: int = Field(..., description="Y pixel coordinate")
    w: int = Field(..., description="Width in pixels")
    h: int = Field(..., description="Height in pixels")
    width: Optional[int] = Field(None, description="Width alias in pixels")
    height: Optional[int] = Field(None, description="Height alias in pixels")
    confidence: Optional[float] = Field(1.0, description="Detection confidence score")
    label: Optional[str] = Field(EntityLabel.PANEL_STANDARD.value, description="Detected entity label")
    category: Optional[str] = Field(EntityCategory.PANEL.value, description="Entity category")
    type: Optional[str] = Field("panel", description="Entity type")
    sub_type: Optional[str] = Field("standard_framed", description="Panel layout sub-type")
    has_bound_bubbles: bool = Field(False, description="Whether dialogue bubbles were bound inside")
    speech_bubbles_count: int = Field(0, description="Count of speech bubbles in panel")
    speech_bubbles: List[SpeechBubbleItem] = Field(default_factory=list, description="Bound speech bubble items")


class DetectSmallPanelsRequest(BaseModel):
    """Request payload for Small Image & Single Frame detection."""
    url: Optional[str] = Field(None, description="Target image public URL")
    image_base64: Optional[str] = Field(None, description="Base64-encoded image data")
    engine_mode: Literal["cv_yolo", "ai_vision"] = Field(
        "cv_yolo",
        description="Detection strategy: 'cv_yolo' (OpenCV + YOLO Dialogue/Panels) or 'ai_vision' (Full AI Vision OCR & Flow)"
    )
    aspect_ratio: str = Field("free", description="Target aspect ratio lock")
    auto_trim: bool = Field(True, description="Auto-trim solid background borders")
    snap_to_frame: bool = Field(True, description="Snap tightly to black border frame")
    merge_speech_bubbles: bool = Field(True, description="Bind nearby speech bubbles into panel")
    filter_gutter_sfx: bool = Field(True, description="Filter loose SFX in empty gutters")
    bleed_padding_px: int = Field(5, description="Padding in pixels around detected frame")


class DetectSmallPanelsResponse(BaseModel):
    """Response payload for Small Image & Single Frame detection."""
    success: bool
    crop_type: str = "small_panels"
    engine_mode: str = "cv_yolo"
    image_width: int = Field(0, description="Source image width in pixels")
    image_height: int = Field(0, description="Source image height in pixels")
    panel: Optional[PanelBoundingBox] = None
    panels: List[PanelBoundingBox] = Field(default_factory=list)
    speech_bubbles: List[SpeechBubbleItem] = Field(default_factory=list)
    total_speech_bubbles_count: int = 0
    bound_speech_bubbles_count: int = 0
    margins: Dict[str, Any] = Field(default_factory=dict)
    message: Optional[str] = None


class DetectLongPanelsRequest(BaseModel):
    """Request payload for Tall Webtoon Strip detection."""
    url: Optional[str] = Field(None, description="Target image public URL")
    image_base64: Optional[str] = Field(None, description="Base64-encoded image data")
    engine_mode: Literal["cv_yolo", "ai_vision"] = Field(
        "cv_yolo",
        description="Detection strategy: 'cv_yolo' (OpenCV + YOLO Dialogue/Panels) or 'ai_vision' (Full AI Vision OCR & Flow)"
    )
    sensitivity: float = Field(30.0, ge=0.0, le=100.0, description="Gutter seam sensitivity")
    background_mode: str = Field("auto", description="'auto', 'white', 'black'")
    min_panel_height: int = Field(150, ge=10, description="Minimum panel height in pixels")
    overlap_merge_threshold: int = Field(20, ge=0, description="Pixel overlap merge threshold")
    auto_split: bool = Field(True, description="Auto-split tall strips at gutters")
    bleed_padding_px: int = Field(5, description="Padding in pixels around each slice")


class DetectLongPanelsResponse(BaseModel):
    """Response payload for Tall Webtoon Strip detection."""
    success: bool
    crop_type: str = "long_panels"
    engine_mode: str = "cv_yolo"
    total_panels: int = 0
    total_speech_bubbles_count: int = 0
    image_width: int = 0
    image_height: int = 0
    reading_flow: str = "top_to_bottom"
    panels: List[PanelBoundingBox] = Field(default_factory=list)
    gutter_count: int = 0
    message: Optional[str] = None


class DetectPanelsUrlRequest(BaseModel):
    """General URL or Base64 request for panel detection."""
    url: Optional[str] = None
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    engine_mode: Literal["cv_yolo", "ai_vision"] = Field(
        "cv_yolo",
        description="Detection strategy: 'cv_yolo' (OpenCV + YOLO) or 'ai_vision' (Full AI Vision)"
    )
    sensitivity: float = Field(30.0, ge=0.0, le=100.0)
    background_mode: str = "auto"
    min_width_pct: float = 0.15
    min_height_px: int = 60
    merge_threshold: int = 20
    aspect_ratio: str = "free"
    canny_low: int = 20
    canny_high: int = 100
    close_kernel_size: int = 15
    auto_split: bool = True
    use_yolo: bool = True


class DetectPanelsBase64Request(DetectPanelsUrlRequest):
    """Backward-compatible alias for Base64 panel detection."""
    pass


class DetectPanelsBatchRequest(BaseModel):
    """Batch URL request for concurrent panel detection."""
    urls: List[str] = Field(..., description="List of image URLs to detect")
    sensitivity: float = Field(30.0, ge=0.0, le=100.0)
    background_mode: str = "auto"
    aspect_ratio: str = "free"
    auto_split: bool = True


class DetectPanelsBatchResponse(BaseModel):
    """Batch URL response for concurrent panel detection."""
    success: bool
    total_images: int = 0
    results: List[Dict[str, Any]] = Field(default_factory=list)
    message: Optional[str] = None


class PanelDetectionResponse(BaseModel):
    """Unified / Legacy result of comic panel and bubble detection."""
    success: bool
    panels: List[PanelBoundingBox] = Field(default_factory=list)
    count: int = 0
    total_panels: int = 0
    imageWidth: Optional[int] = None
    imageHeight: Optional[int] = None
    isTallStrip: bool = False
    fallback: bool = False
    total_speech_bubbles_count: int = 0
    message: Optional[str] = None
