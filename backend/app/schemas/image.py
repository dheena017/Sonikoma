"""
backend/app/schemas/image.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for image transformations, cleaning, OCR, and stitching.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from services.image.processing.imagemagick import ResizeMode


# =============================================================================
# 1. Image Editing & Transformations
# =============================================================================

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


# =============================================================================
# 2. Bubble Removal & Layer Cleaning
# =============================================================================

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


# =============================================================================
# 3. OCR & Utilities
# =============================================================================

class OCRBase64Request(BaseModel):
    """Base64-encoded EasyOCR text detection request."""
    image_base64: str = Field(..., description="Base64-encoded panel image")
    langs: List[str] = Field(default=["en"], description="Language codes for EasyOCR")


class DownloadZipRequest(BaseModel):
    """Requests a ZIP archive containing specified image URLs."""
    urls: List[str]
    url: Optional[str] = None
