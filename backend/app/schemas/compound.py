"""
backend/app/schemas/compound.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for compound.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime

class VideoCutSpec(BaseModel):
    start: float = Field(..., ge=0.0)
    end: float = Field(..., gt=0.0)
    fade_in: Optional[float] = Field(0.0, ge=0.0)
    fade_out: Optional[float] = Field(0.0, ge=0.0)


class VideoEditingWorkflowRequest(BaseModel):
    video_path: str
    cuts: List[VideoCutSpec]
    audio_path: Optional[str] = None
    output_dir: Optional[str] = None


class AudioEnhancementWorkflowRequest(BaseModel):
    audio_path: str
    transcribe: Optional[bool] = True
    analyze: Optional[bool] = True
    output_dir: Optional[str] = None


class ImageGenerationWorkflowRequest(BaseModel):
    prompts: List[str]
    enhance: Optional[bool] = True
    output_dir: Optional[str] = None

