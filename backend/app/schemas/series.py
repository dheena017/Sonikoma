"""
backend/app/schemas/series.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for AI Multi-Chapter Series, Character DNA, and Chapter Sessions.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


MediumType = Literal["anime", "manhwa", "comic", "manga"]


class CharacterDNA(BaseModel):
    """Visual and acoustic identity definition for character consistency."""
    id: str = Field(..., description="Unique character identifier (e.g. 'char_hero')")
    name: str = Field(..., description="Character display name (e.g. 'Jin-Woo')")
    role: Literal["protagonist", "antagonist", "heroine", "supporting", "narrator"] = "protagonist"
    visual_prompt: str = Field(
        ...,
        description="Detailed visual prompt describing hair, eyes, facial features, armor, and weapon."
    )
    voice_id: Optional[str] = Field(None, description="Edge-TTS voice identifier for this character")
    reference_image_url: Optional[str] = Field(None, description="Image reference URL for seed locking")


class CreateSeriesRequest(BaseModel):
    """Payload to initiate a new multi-chapter AI series generation."""
    title: str = Field(..., min_length=1, max_length=120, description="Title of the series")
    synopsis: str = Field(..., min_length=5, description="Core storyline, premise, or concept prompt")
    genre: str = Field(default="action_fantasy", description="Genre (e.g. 'action_fantasy', 'romance', 'sci_fi')")
    medium_type: MediumType = Field(
        default="manhwa",
        description="Target medium: 'anime' (watch video), 'manhwa' (read vertical), 'comic'/'manga' (read paginated)"
    )
    image_model: str = Field(
        default="pollinations-flux",
        description="AI Image generation engine ('pollinations-flux', 'sdxl-turbo', 'imagen-3', 'comfyui')"
    )
    voice_language: str = Field(
        default="en-US",
        description="Spoken dialogue and narrator language (e.g. 'en-US', 'ja-JP', 'ko-KR', 'es-ES')"
    )
    total_chapters: int = Field(
        default=3,
        ge=1,
        le=25,
        description="Total chapters/episodes to generate (from 1 up to 25 chapters)"
    )
    pacing: str = Field(
        default="standard",
        description="Panel density per chapter: 'quick' (25 panels), 'standard' (50 panels), 'epic' (80 panels)"
    )
    character_cast: Optional[List[CharacterDNA]] = Field(
        default_factory=list,
        description="Cast of characters with appearance and voice definitions"
    )
    enable_dialogue_bubbles: bool = Field(
        default=True,
        description="Whether to generate interactive vector speech bubbles"
    )


class ChapterResponse(BaseModel):
    """Detailed metadata and progress for a single chapter session."""
    id: str
    series_id: str
    chapter_number: int
    title: str
    synopsis: Optional[str] = None
    medium_type: str = "manhwa"
    status: str = "pending"  # pending | scripting | generating_art | rendering | ready | failed
    progress_percent: float = 0.0
    current_stage_label: str = "Queued"
    panels_count: int = 0
    video_url: Optional[str] = None
    webtoon_strip_urls: Optional[List[str]] = None
    comic_pages: Optional[List[Dict[str, Any]]] = None
    created_at: str

    class Config:
        from_attributes = True


class SeriesResponse(BaseModel):
    """Complete series project with nested chapter progress and character cast."""
    id: str
    title: str
    slug: Optional[str] = None
    synopsis: Optional[str] = None
    author: Optional[str] = None
    genre: str = "action_fantasy"
    medium_type: str = "manhwa"
    image_model: str = "pollinations-flux"
    voice_language: str = "en-US"
    total_chapters: int = 1
    status: str = "ready"
    cover_image: Optional[str] = None
    character_cast: List[CharacterDNA] = Field(default_factory=list)
    chapters: List[ChapterResponse] = Field(default_factory=list)
    created_at: str

    class Config:
        from_attributes = True
