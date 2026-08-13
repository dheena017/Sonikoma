"""
backend/app/schemas/export.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for YouTube export and profile settings.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel
from typing import List, Optional


# =============================================================================
# 1. YouTube Export & Publishing
# =============================================================================

class YouTubeExportRequest(BaseModel):
    """Parameters for exporting and publishing a video to YouTube."""
    video_url: str
    title: str
    synopsis: str
    tags: Optional[List[str]] = None
    privacy_status: Optional[str] = "unlisted"
    category_id: Optional[str] = "1"
    is_short: Optional[bool] = False
    thumbnail_url: Optional[str] = None


class YouTubeProfileRequest(BaseModel):
    """Reusable profile templates for YouTube publishing defaults."""
    name: str
    title_template: str
    description_template: str
    tags: List[str]
    category_id: Optional[str] = "1"
    privacy_status: Optional[str] = "unlisted"
    is_short: Optional[bool] = False
    made_for_kids: Optional[str] = "no"
    paid_promotion: Optional[bool] = False
    license: Optional[str] = "youtube"
    video_language: Optional[str] = "en"
    channel_link: Optional[str] = ""
    discord_link: Optional[str] = ""
    patreon_link: Optional[str] = ""


class YouTubeCredentialsRequest(BaseModel):
    """OAuth API client keys for YouTube integrations."""
    client_id: str
    client_secret: str
    project_id: str
