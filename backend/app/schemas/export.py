"""
backend/app/schemas/export.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for export.
─────────────────────────────────────────────────────────────────────────────
"""

from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional, Literal, Union
from datetime import datetime

class YouTubeExportRequest(BaseModel):
    video_url: str
    title: str
    synopsis: str
    tags: Optional[List[str]] = None
    privacy_status: Optional[str] = "unlisted"
    category_id: Optional[str] = "1"
    is_short: Optional[bool] = False
    thumbnail_url: Optional[str] = None


class YouTubeProfileRequest(BaseModel):
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
    client_id: str
    client_secret: str
    project_id: str

