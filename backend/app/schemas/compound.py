"""
backend/app/schemas/compound.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for multi-step compound workflows.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# =============================================================================
# 1. Compound Workflows
# =============================================================================

class VideoCutSpec(BaseModel):
    """Defines start, end, and fade durations for video cuts."""
    start: float = Field(..., ge=0.0)
    end: float = Field(..., gt=0.0)
    fade_in: Optional[float] = Field(0.0, ge=0.0)
    fade_out: Optional[float] = Field(0.0, ge=0.0)


class VideoEditingWorkflowRequest(BaseModel):
    """Combined video trimming and audio stitching workflow."""
    video_path: str
    cuts: List[VideoCutSpec]
    audio_path: Optional[str] = None
    output_dir: Optional[str] = None


class AudioEnhancementWorkflowRequest(BaseModel):
    """End-to-end audio transcription and analysis workflow."""
    audio_path: str
    transcribe: Optional[bool] = True
    analyze: Optional[bool] = True
    output_dir: Optional[str] = None


class ImageGenerationWorkflowRequest(BaseModel):
    """Multi-prompt image generation and prompt enhancement pipeline."""
    prompts: List[str]
    enhance: Optional[bool] = True
    output_dir: Optional[str] = None
