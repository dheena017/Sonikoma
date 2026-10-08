"""
backend/features/creative/agent/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the Autonomous Creative AI Agent:
- One-Click Agent execution requests & configuration
- Real-time pipeline step monitoring, logs & progress
- Panel extractions, AI story narration & YouTube publication results
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class AgentRunRequest(BaseModel):
    """Configuration submitted by the user to launch the One-Click AI Agent."""
    url: str = Field(..., description="Target Webtoon, Manga, or Comic URL to scrape and transform")
    video_format: Literal["shorts", "landscape"] = Field(
        default="shorts",
        description="Target video aspect ratio: 'shorts' (9:16 vertical) or 'landscape' (16:9 widescreen)"
    )
    language: str = Field(
        default="en",
        description="Target narrative / translation language code (e.g. 'en', 'es', 'ja', 'ko', 'fr')"
    )
    voice: str = Field(
        default="alloy",
        description="Voice actor model identifier for neural text-to-speech"
    )
    privacy_status: Literal["unlisted", "public", "private"] = Field(
        default="unlisted",
        description="YouTube publication visibility status"
    )
    review_mode: bool = Field(
        default=False,
        description="If True, pauses at the narrative/panel review step before rendering & uploading"
    )
    max_panels: Optional[int] = Field(
        default=None,
        description="Optional maximum panels to extract (uses all available chapter panels if omitted)"
    )
    title_override: Optional[str] = Field(
        default=None,
        description="Optional manual title override for the story and YouTube video"
    )


class AgentLogMessage(BaseModel):
    """A timestamped log item emitted by the autonomous agent."""
    timestamp: float
    stage: str
    level: Literal["info", "success", "warning", "error"] = "info"
    message: str


class AgentPanel(BaseModel):
    """An individual comic panel extracted, narrated, and timed by the agent."""
    index: int
    image_url: str
    speech_text: str
    audio_url: Optional[str] = None
    duration: float = 3.5
    motion_type: str = "zoom_in"
    sfx: Optional[str] = None


class AgentYouTubeMetadata(BaseModel):
    """SEO and publishing metadata formatted for YouTube."""
    title: str
    description: str
    tags: List[str] = Field(default_factory=list)
    category_id: str = "1"
    privacy_status: str = "unlisted"
    is_short: bool = False
    thumbnail_url: Optional[str] = None


class AgentRunResponse(BaseModel):
    """Current snapshot of an Autonomous Agent run."""
    run_id: str
    user_id: Optional[str] = None
    status: Literal[
        "initializing",
        "scraping",
        "processing_images",
        "generating_narrative",
        "synthesizing_audio",
        "awaiting_review",
        "rendering_video",
        "publishing_youtube",
        "completed",
        "failed"
    ]
    progress: int = Field(0, ge=0, le=100)
    current_action: str = ""
    logs: List[AgentLogMessage] = Field(default_factory=list)
    scraped_title: Optional[str] = None
    raw_images_count: int = 0
    panels: List[AgentPanel] = Field(default_factory=list)
    video_filename: Optional[str] = None
    video_url: Optional[str] = None
    youtube_metadata: Optional[AgentYouTubeMetadata] = None
    youtube_url: Optional[str] = None
    error: Optional[str] = None
    created_at: float
    updated_at: float


class AgentApproveRequest(BaseModel):
    """Payload to resume an agent run paused in 'awaiting_review' status."""
    title_override: Optional[str] = None
    privacy_status: Optional[Literal["unlisted", "public", "private"]] = None


class AgentHistoryListResponse(BaseModel):
    """List of recent agent execution runs."""
    runs: List[AgentRunResponse]
    total: int


__all__ = [
    "AgentRunRequest",
    "AgentLogMessage",
    "AgentPanel",
    "AgentYouTubeMetadata",
    "AgentRunResponse",
    "AgentApproveRequest",
    "AgentHistoryListResponse",
]
