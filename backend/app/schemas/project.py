"""
backend/app/schemas/project.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for projects.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime

class ProjectCreateRequest(BaseModel):
    project_id: str = Field(..., description="Unique Project ID")
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
    image_url: Optional[str] = Field("")
    original_image_url: Optional[str] = Field(None, alias="original_url")
    speech_text: Optional[str] = Field("")
    sfx: Optional[str] = Field("")
    duration: Optional[float] = Field(0.0)
    motion_type: Optional[str] = Field("")
    visual_description: Optional[str] = Field(None)
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
    panels: List[PanelSaveItem] = Field(..., description="Curated panel items list")


class ProjectUpdateRequest(BaseModel):
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


class TokenIncrementRequest(BaseModel):
    tokens: int = Field(..., description="Number of tokens to add")


class BatchDeleteRequest(BaseModel):
    project_ids: List[str] = Field(..., description="List of Project IDs to delete")



class DetectPanelsBase64Request(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source image")
    sensitivity: float = Field(30.0, ge=0.0, le=100.0)
    background_mode: Literal["auto", "white", "black"] = "auto"
    min_width_pct: float = Field(0.15, ge=0.0, le=1.0)
    min_height_px: int   = Field(60, ge=1)
    merge_threshold: int = Field(20, ge=0)
    aspect_ratio: Literal["free", "1:1", "16:9", "9:16", "4:3"] = "free"
    canny_low: int  = Field(20, ge=0, le=255)
    canny_high: int = Field(100, ge=0, le=255)
    close_kernel_size: int = Field(15, ge=1, le=99)
    auto_split: bool = Field(True, description="Automatically split tall strips at gutters")

