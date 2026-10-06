"""
backend/features/workspace/schemas.py
─────────────────────────────────────────────────────────────────────────────
Unified Pydantic models and schemas for the Workspace feature domain:
- Shell: Workspace editor modes, canvas viewport context, and session updates
- Storyboard: AI frames, voiceover scripts, dialogue, and duration metadata
- Viewer: Webtoon / Manga reader pages and reading progress tracking
- Imported Assets: Project media asset items, upload responses, and deletion
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# 1. Workspace Shell Schemas
# ─────────────────────────────────────────────────────────────────────────────

class WorkspaceMode(BaseModel):
    id: str  # "storyboard", "viewer", "imported_assets", "image_editor", "video_editor"
    label: str
    icon: str
    shortcut: Optional[str] = None


class WorkspaceContextResponse(BaseModel):
    project_id: str
    chapter_id: Optional[str] = None
    project_name: str
    active_mode: str = "storyboard"
    available_modes: List[WorkspaceMode]
    viewport_zoom: float = 1.0
    panel_split_layout: str = "horizontal"  # horizontal, vertical, single
    sidebar_open: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


class WorkspaceStateUpdate(BaseModel):
    active_mode: Optional[str] = None
    chapter_id: Optional[str] = None
    viewport_zoom: Optional[float] = None
    panel_split_layout: Optional[str] = None
    sidebar_open: Optional[bool] = None
    metadata: Optional[Dict[str, Any]] = None


# ─────────────────────────────────────────────────────────────────────────────
# 2. Storyboard Schemas
# ─────────────────────────────────────────────────────────────────────────────

class StoryboardFrame(BaseModel):
    id: str
    panel_index: int
    image_url: str
    description: Optional[str] = None
    voiceover_script: Optional[str] = None
    dialogue: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    sound_effects: Optional[List[str]] = Field(default_factory=list)
    camera_movement: Optional[str] = "pan"  # pan, zoom_in, zoom_out, static
    duration_seconds: float = 3.0
    emotion: Optional[str] = "neutral"
    aspect_ratio: str = "16:9"


class StoryboardData(BaseModel):
    project_id: str
    chapter_id: str
    title: str
    frames: List[StoryboardFrame] = Field(default_factory=list)
    total_duration_seconds: float = 0.0
    metadata: Dict[str, Any] = Field(default_factory=dict)


class StoryboardUpdateRequest(BaseModel):
    frames: List[StoryboardFrame]
    metadata: Optional[Dict[str, Any]] = None


# ─────────────────────────────────────────────────────────────────────────────
# 3. Viewer Schemas
# ─────────────────────────────────────────────────────────────────────────────

class ViewerPage(BaseModel):
    index: int
    image_url: str
    width: Optional[int] = None
    height: Optional[int] = None
    aspect_ratio: Optional[float] = None


class ViewerChapterResponse(BaseModel):
    project_id: str
    chapter_id: str
    chapter_title: str
    total_pages: int
    reading_mode: str = "webtoon"  # webtoon (vertical), manga (right-to-left), comic (left-to-right)
    pages: List[ViewerPage] = Field(default_factory=list)
    next_chapter_id: Optional[str] = None
    prev_chapter_id: Optional[str] = None


class ViewerProgressUpdate(BaseModel):
    current_page_index: int = 0
    scroll_offset_percent: float = 0.0
    completed: bool = False


class ViewerProgressResponse(BaseModel):
    success: bool = True
    project_id: str
    chapter_id: str
    current_page_index: int
    scroll_offset_percent: float
    completed: bool


# ─────────────────────────────────────────────────────────────────────────────
# 4. Imported Assets Schemas
# ─────────────────────────────────────────────────────────────────────────────

class AssetItem(BaseModel):
    id: str
    name: str
    asset_type: str  # image, audio, video, panel, reference
    url: str
    size_bytes: int
    size_formatted: str
    created_at: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AssetListResponse(BaseModel):
    success: bool = True
    project_id: str
    total_assets: int
    assets: List[AssetItem] = Field(default_factory=list)


class AssetUploadResponse(BaseModel):
    success: bool = True
    asset: AssetItem
    message: str


class AssetDeleteResponse(BaseModel):
    success: bool = True
    asset_id: str
    message: str


__all__ = [
    # Shell
    "WorkspaceMode",
    "WorkspaceContextResponse",
    "WorkspaceStateUpdate",
    # Storyboard
    "StoryboardFrame",
    "StoryboardData",
    "StoryboardUpdateRequest",
    # Viewer
    "ViewerPage",
    "ViewerChapterResponse",
    "ViewerProgressUpdate",
    "ViewerProgressResponse",
    # Imported Assets
    "AssetItem",
    "AssetListResponse",
    "AssetUploadResponse",
    "AssetDeleteResponse",
]
