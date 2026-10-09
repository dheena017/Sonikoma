"""
backend/features/creative/thumbnails/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the AI Thumbnail Generator Studio:
- Batch generation requests (3 or 6 image packages)
- Archetype layout configurations
- Generated thumbnail items & responses
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class ThumbnailPanelInput(BaseModel):
    """Reference to a comic panel or image used in thumbnail composition."""
    model_config = ConfigDict(extra="ignore")
    id: Optional[str] = None
    image_url: Optional[str] = ""
    speech_text: Optional[str] = None
    role: Optional[str] = None


class ThumbnailGenerateRequest(BaseModel):
    """Payload to trigger batch AI thumbnail generation."""
    model_config = ConfigDict(extra="ignore")
    prompt: Optional[str] = Field(
        default="",
        description="User custom prompt or concept describing desired thumbnail mood, text, or focus"
    )
    count: Optional[int] = Field(
        default=1,
        description="Number of thumbnails to generate: 1 image"
    )
    series_title: Optional[str] = Field(
        default="Webtoon Climax",
        description="Title of the series or chapter"
    )
    genre: Optional[str] = Field(
        default="Action Fantasy",
        description="Story genre"
    )
    panels: Optional[List[ThumbnailPanelInput]] = Field(
        default_factory=list,
        description="List of comic panels / frame image URLs to map into the thumbnails"
    )
    hook_text_override: Optional[str] = Field(
        default=None,
        description="Optional custom hook text override"
    )
    video_url: Optional[str] = Field(
        default=None,
        description="Optional final compiled video URL"
    )
    style: Optional[str] = Field(
        default=None,
        description="Visual style direction"
    )


class GeneratedThumbnailItem(BaseModel):
    """A single generated thumbnail output."""
    id: str
    image_url: str
    archetype: str
    archetype_label: str
    hook_text: str
    title: str
    prompt_used: str
    palette: List[str]
    width: int = 1280
    height: int = 720
    created_at: float
    tier_used: Optional[str] = "Tier 1: Primary"
    model_used: Optional[str] = "flux-anime"
    provider_used: Optional[str] = "Pollinations AI"
    cascade_path: Optional[str] = None
    routing_message: Optional[str] = None


class ThumbnailGenerateResponse(BaseModel):
    """Response containing the generated thumbnail package and AI cascade telemetry."""
    success: bool = True
    count: int
    prompt: str
    series_title: str
    thumbnails: List[GeneratedThumbnailItem]
    execution_time_ms: float
    tier_used: Optional[str] = "Tier 1: Primary"
    model_used: Optional[str] = "flux-anime"
    provider_used: Optional[str] = "Pollinations AI"
    cascade_path: Optional[str] = None
    routing_message: Optional[str] = None


__all__ = [
    "ThumbnailPanelInput",
    "ThumbnailGenerateRequest",
    "GeneratedThumbnailItem",
    "ThumbnailGenerateResponse",
]
