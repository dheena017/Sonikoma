"""
backend/app/schemas/ocr.py
─────────────────────────────────────────────────────────────────────────────
Pydantic models and schemas for comic speech dialogue OCR extraction.
─────────────────────────────────────────────────────────────────────────────
"""

from enum import Enum
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


class OcrTextType(str, Enum):
    DIALOGUE = "dialogue"
    THOUGHT = "thought"
    CAPTION = "caption"
    SFX = "sound_effect"
    WATERMARK = "watermark"
    UNKNOWN = "unknown"


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
    languages: List[str] = Field(default_factory=lambda: ["en", "ko", "ja"], description="Target OCR languages")
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
