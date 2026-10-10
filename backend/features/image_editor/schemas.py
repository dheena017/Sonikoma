"""
backend/features/image_editor/schemas.py
─────────────────────────────────────────────────────────────────────────────
Unified Pydantic models and schemas for the Image Editor domain:
- Image cropping, slicing, margin trimming, and layout classification
- Transformations, rotation, aspect ratio locking, stitching, and resizing
- Speech bubble detection, removal, layer separation, and inpainting
- Dialogue OCR detection and text extraction
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import List, Optional, Literal, Dict, Any, Union
from pydantic import BaseModel, Field, model_validator


# ─────────────────────────────────────────────────────────────────────────────
# 1. Enums & Classification
# ─────────────────────────────────────────────────────────────────────────────

class ResizeMode(str, Enum):
    """Image resize modes."""
    EXACT = "exact"        # Exact size, may distort
    FIT = "fit"           # Fit within bounds, preserve aspect
    FILL = "fill"         # Fill bounds, may crop
    PAD = "pad"           # Pad with color to reach size


class DetectedLayoutType(str, Enum):
    """Supported comic panel & image layout formats."""
    LONG_PANELS = "long_panels"               # Tall continuous vertical webtoon scroll (2-5 panels)
    ULTRA_LONG_PANELS = "ultra_long_panels"   # Giant full-chapter continuous scroll strip (6-50+ panels)
    SMALL_PANELS = "small_panels"             # Single isolated small panel / illustration
    SINGLE_PANELS = "small_panels"            # Alias for backward compatibility
    MULTI_GRID_PAGE = "multi_grid_page"       # Standard manga/comic page with multiple framed boxes
    DOUBLE_PAGE_SPREAD = "double_page_spread" # 2-page landscape panorama
    FOUR_KOMA = "four_koma"                   # 4-panel vertical strip (Yonkoma)
    SPLASH_PAGE = "splash_page"               # Full illustration page without internal gutters


class ReadingFlow(str, Enum):
    """Reading flow direction."""
    TOP_TO_BOTTOM = "top_to_bottom"  # Webtoons / Manhwa
    RIGHT_TO_LEFT = "right_to_left"  # Traditional Japanese Manga
    LEFT_TO_RIGHT = "left_to_right"  # Western Comics & Manhua


class OcrTextType(str, Enum):
    """Semantic dialogue text classification."""
    DIALOGUE = "dialogue"
    THOUGHT = "thought"
    CAPTION = "caption"
    SFX = "sound_effect"
    WATERMARK = "watermark"
    UNKNOWN = "unknown"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Image Transformations & Editing Schemas
# ─────────────────────────────────────────────────────────────────────────────

class EditImageRequest(BaseModel):
    """Cropping, trimming, aspect ratio, rotation, and quality adjustments."""
    url: str
    cropTop: Optional[float] = 0.0
    cropBottom: Optional[float] = 0.0
    cropLeft: Optional[float] = 0.0
    cropRight: Optional[float] = 0.0
    autoTrim: Optional[bool] = True
    sensitivity: Optional[float] = None
    padding: Optional[int] = None
    backgroundColorMode: Optional[str] = "auto"
    rotate: Optional[float] = 0.0
    flipHorizontal: Optional[bool] = False
    aspectRatio: Optional[str] = "free"
    outputFormat: Optional[str] = "jpeg"
    cropQuality: Optional[int] = 90


class UndoEditRequest(BaseModel):
    """Reverts image modifications."""
    url: str


class TransformImageRequest(BaseModel):
    """Basic rotation and flip operations."""
    url: str
    type: Literal["rotate", "flip"]
    value: str


class StitchImagesRequest(BaseModel):
    """Merges multiple images horizontally or vertically."""
    url1: Optional[str] = None
    url2: Optional[str] = None
    imageUrl1: Optional[str] = None
    imageUrl2: Optional[str] = None
    urls: Optional[List[str]] = None
    direction: Optional[Literal["vertical", "horizontal"]] = "vertical"
    layout: Optional[Literal["vertical", "horizontal"]] = "vertical"
    spacing: Optional[int] = 0
    spacingColor: Optional[str] = "white"
    scaleToFit: Optional[bool] = True
    alignment: Optional[Literal["center", "start", "end"]] = "center"
    alignMode: Optional[Literal["center", "start", "end"]] = "center"
    padding: Optional[int] = 0
    format: Optional[str] = "PNG"


class SplitImagesRequest(BaseModel):
    """Splits long vertical images along defined lines."""
    url: str
    splitLines: Optional[List[float]] = Field(default_factory=list)
    split_points: Optional[List[float]] = None
    format: Optional[str] = "jpeg"


class StitchImagesResponse(BaseModel):
    """Result of stitching multiple images."""
    success: bool
    url: str
    supabase_url: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class SplitSliceItem(BaseModel):
    """Single slice segment produced by image splitting."""
    index: int
    url: str
    y_start: Optional[int] = None
    y_end: Optional[int] = None
    height: Optional[int] = None


class SplitImagesResponse(BaseModel):
    """Result of splitting an image into slices."""
    success: bool
    slices: List[SplitSliceItem] = []
    urls: List[str] = []
    count: int = 0


class BatchResizeRequest(BaseModel):
    """Resizes multiple images at once."""
    image_paths: List[str]
    output_dir: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    mode: Optional[ResizeMode] = ResizeMode.FIT
    quality: Optional[int] = Field(85, ge=1, le=100)


class CompositeRequest(BaseModel):
    """Overlays one image onto a base image."""
    base_image_path: str
    overlay_image_path: str
    output_path: Optional[str] = None
    x: Optional[int] = 0
    y: Optional[int] = 0
    opacity: Optional[float] = Field(1.0, ge=0.0, le=1.0)


class ImagePathRequest(BaseModel):
    """Local file path wrapper."""
    image_path: str
    output_path: Optional[str] = None


class MetadataRequest(BaseModel):
    """Requests image EXIF/technical metadata."""
    image_path: str


class DownloadZipRequest(BaseModel):
    """Requests a ZIP archive containing specified image URLs."""
    urls: List[str]
    url: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# 3. Panel Detection & Cropping Schemas
# ─────────────────────────────────────────────────────────────────────────────

class DetectTypeRequest(BaseModel):
    """Request payload for layout and crop type detection."""
    url: Optional[str] = Field(default=None, description="Image URL or data URI")
    image_base64: Optional[str] = Field(default=None, description="Raw base64-encoded image data")


class DetectTypeResponse(BaseModel):
    """Rich layout classification and structural metadata response."""
    success: bool
    crop_type: DetectedLayoutType = Field(..., description="Detected layout identifier")
    type_label: str = Field(..., description="Human-readable title (e.g., 'Tall Webtoon Scroll')")
    confidence: float = Field(default=0.95, description="Classification confidence score (0.0 - 1.0)")
    width: int = Field(default=0, description="Image width in pixels")
    height: int = Field(default=0, description="Image height in pixels")
    aspect_ratio: float = Field(default=1.0, description="Height / Width ratio")
    estimated_panel_count: int = Field(default=1, description="Estimated number of panels detected from gutters")
    reading_flow: ReadingFlow = Field(default=ReadingFlow.TOP_TO_BOTTOM, description="Estimated reading direction")
    detected_bg_color: str = Field(default="white", description="'white', 'black', or custom hex color")
    edge_complexity: str = Field(default="medium", description="'low', 'medium', or 'high'")
    optimal_canny_thresholds: Dict[str, int] = Field(default_factory=lambda: {"low": 20, "high": 100})
    recommended_endpoint: str = Field(..., description="Target API endpoint for cropping")
    suggested_strategy: str = Field(default="batch_slice", description="'batch_slice', 'margin_crop', 'grid_split'")
    message: Optional[str] = None


class PanelBoundingBox(BaseModel):
    """Bounding box coordinates for an individual panel slice."""
    id: Optional[Union[str, int]] = Field(default=None, description="Panel identifier")
    panel_id: Optional[str] = Field(default=None, description="String panel ID (e.g., 'panel_01')")
    x: int = Field(default=0, description="X pixel start coordinate")
    y: int = Field(default=0, description="Y pixel start coordinate")
    w: Optional[int] = Field(default=None, description="Width alias in pixels")
    h: Optional[int] = Field(default=None, description="Height alias in pixels")
    width: int = Field(default=0, description="Width in pixels")
    height: int = Field(default=0, description="Height in pixels")
    crop_top: float = Field(default=0.0, description="Normalized or percentage top crop offset")
    crop_bottom: float = Field(default=0.0, description="Normalized or percentage bottom crop offset")
    crop_left: float = Field(default=0.0, description="Normalized or percentage left crop offset")
    crop_right: float = Field(default=0.0, description="Normalized or percentage right crop offset")
    padding_px: int = Field(default=0, description="Optional extra border padding")

    @model_validator(mode="before")
    @classmethod
    def sync_dimensions(cls, data: Any) -> Any:
        if isinstance(data, dict):
            x = data.get("x") if data.get("x") is not None else data.get("left", 0)
            y = data.get("y") if data.get("y") is not None else data.get("top", 0)
            w = data.get("width")
            if w is None or w == 0:
                w = data.get("w", 0)
            h = data.get("height")
            if h is None or h == 0:
                h = data.get("h", 0)
            data["x"] = int(x or 0)
            data["y"] = int(y or 0)
            data["width"] = int(w or 0)
            data["height"] = int(h or 0)
            data["w"] = int(w or 0)
            data["h"] = int(h or 0)
        return data


class CroppedSliceItem(BaseModel):
    """Enriched metadata for a sliced panel asset."""
    index: int = Field(..., description="0-indexed order of the slice in reading sequence")
    panel_id: Optional[str] = Field(default=None, description="Source panel identifier")
    url: str = Field(..., description="Public media URL of the cropped slice")
    original_url: Optional[str] = Field(default=None, description="Source uncropped strip image URL")
    x: int = Field(default=0, description="Source X coordinate in parent image")
    y: int = Field(default=0, description="Source Y coordinate in parent image")
    width: int = Field(..., description="Output slice width in pixels")
    height: int = Field(..., description="Output slice height in pixels")
    crop_width: int = Field(default=0, description="Width cropped from parent image")
    crop_height: int = Field(default=0, description="Height cropped from parent image")
    aspect_ratio: float = Field(default=1.0, description="Slice aspect ratio (width / height)")
    gutter_after_px: int = Field(default=0, description="Whitespace gap distance in pixels to next panel")
    file_size_bytes: int = Field(default=0, description="Size of generated image file in bytes")


class LongPanelsCropRequest(BaseModel):
    """Request payload for batch slicing long continuous strips."""
    url: str = Field(..., description="Target image URL or data URI")
    panels: List[PanelBoundingBox] = Field(..., description="List of panel bounding boxes to slice")
    bleed_guard_px: int = Field(default=5, description="Extra expansion around speech bubbles & SFX")
    background_mode: str = Field(default="auto", description="'auto', 'white', 'black'")
    output_format: str = Field(default="webp", description="'webp', 'jpeg', or 'png'")
    quality: int = Field(default=90, description="Output compression quality (1-100)")


class LongPanelsCropResponse(BaseModel):
    """Response payload returned from long-panels batch slicing."""
    success: bool
    crop_type: str = "long_panels"
    total_slices: int = Field(..., description="Number of slices generated")
    processing_time_ms: int = Field(default=0, description="Time taken in milliseconds")
    slices: List[CroppedSliceItem] = Field(default_factory=list, description="Ordered list of sliced assets")
    message: Optional[str] = None


class SmallPanelsCropRequest(BaseModel):
    """Request payload for 4-directional margin cropping on small / single images."""
    url: str = Field(..., description="Target image URL or data URI")
    crop_top: float = Field(default=0.0, description="Margin to crop from top/above")
    crop_bottom: float = Field(default=0.0, description="Margin to crop from bottom")
    crop_left: float = Field(default=0.0, description="Margin to crop from left side")
    crop_right: float = Field(default=0.0, description="Margin to crop from right side")
    unit: str = Field(default="percent", description="'percent' (0-100) or 'pixels'")
    aspect_ratio: str = Field(default="free", description="Aspect ratio lock ('free', '9:16', '16:9', '1:1', '4:5')")
    auto_trim: bool = Field(default=False, description="Auto-trim solid background borders")
    color_tolerance: int = Field(default=15, description="Color Euclidean distance tolerance for auto-trim")
    padding_px: int = Field(default=0, description="Extra padding in pixels around cropped output")
    rotate: Optional[float] = Field(default=None, description="Rotation angle in degrees (e.g., 90, 180, 270)")
    flip_horizontal: bool = Field(default=False, description="Flip horizontally")
    output_format: str = Field(default="webp", description="'webp', 'jpeg', or 'png'")
    quality: int = Field(default=90, description="Output compression quality (1-100)")


class SmallPanelsCropResponse(BaseModel):
    """Response payload returned from small-panels margin cropping."""
    success: bool
    crop_type: str = "small_panels"
    url: str = Field(..., description="Public media URL of the cropped output")
    original_url: Optional[str] = Field(default=None, description="Original uncropped source URL")
    width: int = Field(..., description="Output width in pixels")
    height: int = Field(..., description="Output height in pixels")
    aspect_ratio: str = Field(default="free", description="Applied aspect ratio")
    applied_margins: Dict[str, float] = Field(default_factory=dict, description="Pixel offsets applied")
    auto_trimmed: bool = Field(default=False, description="Whether background auto-trim was applied")
    processing_time_ms: int = Field(default=0, description="Processing duration in milliseconds")
    message: Optional[str] = None


SinglePanelsCropRequest = SmallPanelsCropRequest
SinglePanelsCropResponse = SmallPanelsCropResponse


# ─────────────────────────────────────────────────────────────────────────────
# 4. Bubble Removal & Layer Cleaning Schemas
# ─────────────────────────────────────────────────────────────────────────────

class RemoveBubblesRequest(BaseModel):
    """Speech bubble detection and removal parameters."""
    url: str
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    confidence: Optional[float] = None
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


class RemoveBubblesBatchRequest(BaseModel):
    """Batch bubble removal parameters."""
    urls: List[str]
    method: Optional[str] = "auto"
    sensitivity: Optional[float] = 50.0
    confidence: Optional[float] = None
    dilation: Optional[int] = -1
    inpaint_radius: Optional[int] = 3
    detection_style: Optional[str] = "all"


class ProcessLayersRequest(BaseModel):
    """Triggers image layer decomposition."""
    url: str


class CleanerBase64Request(BaseModel):
    """Base64-encoded image cleaning using inpainting/blurring."""
    image_base64: str = Field(..., description="Base64-encoded source image (PNG/JPG)")
    method: Literal["inpaint", "blur"] = Field("inpaint", description="Removal method")
    sensitivity: float = Field(50.0, ge=0.0, le=100.0)
    dilation: int = Field(-1, ge=-1, le=100)
    inpaint_radius: int = Field(3, ge=1, le=20)
    detection_style: str = Field("all")


# ─────────────────────────────────────────────────────────────────────────────
# 5. Dialogue OCR Schemas
# ─────────────────────────────────────────────────────────────────────────────

class OCRBase64Request(BaseModel):
    """Base64-encoded EasyOCR text detection request."""
    image_base64: str = Field(..., description="Base64-encoded panel image")
    langs: List[str] = Field(default=["en"], description="Language codes for EasyOCR")


class OcrTextItem(BaseModel):
    """Represents an individual extracted text segment / dialogue block."""
    segment_id: str = Field(..., description="Unique ID e.g. text_1")
    text: str = Field(..., description="Transcribed text content")
    confidence: float = Field(0.90, ge=0.0, le=1.0, description="OCR confidence score")
    text_type: OcrTextType = Field(OcrTextType.DIALOGUE, description="Semantic text type")
    x: int = Field(..., description="Top-left X coordinate in pixels")
    y: int = Field(..., description="Top-left Y coordinate in pixels")
    width: int = Field(..., description="Width in pixels")
    height: int = Field(..., description="Height in pixels")
    polygon: Optional[List[List[int]]] = Field(None, description="Exact text bounding quad polygon [[x, y], ...]")
    bubble_id: Optional[str] = Field(None, description="Associated YOLO speech bubble ID")
    speaker_id: Optional[str] = Field(None, description="Associated Character speaker ID")
    panel_id: Optional[str] = Field(None, description="Associated parent panel ID")
    reading_order: int = Field(1, description="Sequential reading order index")


class DetectTextRequest(BaseModel):
    """Direct synchronous OCR request payload."""
    url: Optional[str] = Field(None, description="Image URL")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data")
    languages: List[str] = Field(default_factory=lambda: ["en"], description="Target OCR languages")
    bubble_guided: bool = Field(True, description="Filter OCR inside detected speech bubbles for maximum accuracy")
    filter_sfx: bool = Field(False, description="Filter out floating sound effects")
    engine: Literal["auto", "easyocr", "tesseract", "ai_vision"] = Field("auto", description="OCR engine selection")


class DetectTextResponse(BaseModel):
    """Direct synchronous OCR response payload."""
    success: bool
    full_transcript: str = Field("", description="Joined full dialogue transcript")
    total_segments: int = 0
    detected_language: str = "en"
    segments: List[OcrTextItem] = Field(default_factory=list)
    execution_time_ms: int = 0
    message: Optional[str] = None


__all__ = [
    # Enums
    "DetectedLayoutType",
    "ReadingFlow",
    "OcrTextType",
    # Edit & Transforms
    "EditImageRequest",
    "UndoEditRequest",
    "TransformImageRequest",
    "StitchImagesRequest",
    "StitchImagesResponse",
    "SplitImagesRequest",
    "SplitSliceItem",
    "SplitImagesResponse",
    "BatchResizeRequest",
    "CompositeRequest",
    "ImagePathRequest",
    "MetadataRequest",
    "DownloadZipRequest",
    # Panels & Crop
    "DetectTypeRequest",
    "DetectTypeResponse",
    "PanelBoundingBox",
    "CroppedSliceItem",
    "LongPanelsCropRequest",
    "LongPanelsCropResponse",
    "SmallPanelsCropRequest",
    "SmallPanelsCropResponse",
    "SinglePanelsCropRequest",
    "SinglePanelsCropResponse",
    # Cleaner
    "RemoveBubblesRequest",
    "RemoveBubblesBatchRequest",
    "ProcessLayersRequest",
    "CleanerBase64Request",
    # OCR
    "OCRBase64Request",
    "OcrTextItem",
    "DetectTextRequest",
    "DetectTextResponse",
]
