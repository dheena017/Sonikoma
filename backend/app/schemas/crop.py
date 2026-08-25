"""
backend/app/schemas/crop.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas and enums for dedicated comic panel cropping endpoints:
- detect-type: 5-layer layout classification
- long-panels: High-speed multi-panel batch slicing (Webtoon continuous scrolls)
- single-panels: 4-directional margin cropping (Single comic pages & frames)
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


# ─── 1. Enums ─────────────────────────────────────────────────────────────────

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


# ─── 2. Detect-Type Schemas ───────────────────────────────────────────────────

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


# ─── 3. Long-Panels (Batch Slicing) Schemas ───────────────────────────────────

class PanelBoundingBox(BaseModel):
    """Bounding box coordinates for an individual panel slice."""
    id: Optional[Union[str, int]] = Field(default=None, description="Panel identifier")
    panel_id: Optional[str] = Field(default=None, description="String panel ID (e.g., 'panel_01')")
    x: int = Field(default=0, description="X pixel start coordinate")
    y: int = Field(default=0, description="Y pixel start coordinate")
    width: int = Field(default=0, description="Width in pixels")
    height: int = Field(default=0, description="Height in pixels")
    crop_top: float = Field(default=0.0, description="Normalized or percentage top crop offset")
    crop_bottom: float = Field(default=0.0, description="Normalized or percentage bottom crop offset")
    crop_left: float = Field(default=0.0, description="Normalized or percentage left crop offset")
    crop_right: float = Field(default=0.0, description="Normalized or percentage right crop offset")
    padding_px: int = Field(default=0, description="Optional extra border padding")


class CroppedSliceItem(BaseModel):
    """Enriched metadata for a sliced panel asset."""
    index: int = Field(..., description="0-indexed order of the slice in reading sequence")
    panel_id: Optional[str] = Field(default=None, description="Source panel identifier")
    url: str = Field(..., description="Public media URL of the cropped slice")
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


# ─── 4. Small-Panels (4-Way Margin Cropping) Schemas ──────────────────────────

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
    width: int = Field(..., description="Output width in pixels")
    height: int = Field(..., description="Output height in pixels")
    aspect_ratio: str = Field(default="free", description="Applied aspect ratio")
    applied_margins: Dict[str, float] = Field(default_factory=dict, description="Pixel offsets applied")
    auto_trimmed: bool = Field(default=False, description="Whether background auto-trim was applied")
    processing_time_ms: int = Field(default=0, description="Processing duration in milliseconds")
    message: Optional[str] = None


# Backward-compatible aliases
SinglePanelsCropRequest = SmallPanelsCropRequest
SinglePanelsCropResponse = SmallPanelsCropResponse
