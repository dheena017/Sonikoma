"""
backend/app/features/platform/dashboard/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the platform dashboard overview, quick stats, and metrics.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DashboardQuickStats(BaseModel):
    total_projects: int = 0
    active_jobs: int = 0
    total_images_processed: int = 0
    total_videos_rendered: int = 0
    storage_used_bytes: int = 0
    storage_used_formatted: str = "0 B"


class DashboardRecentItem(BaseModel):
    id: str
    title: str
    type: str  # project, video, image, scrape
    updated_at: str
    status: Optional[str] = None
    thumbnail_url: Optional[str] = None


class SystemQuickHealth(BaseModel):
    status: str = "ok"  # ok, degraded, error
    uptime_seconds: float = 0.0
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    disk_percent: float = 0.0
    ai_available: bool = True
    gpu_available: bool = False


class DashboardOverviewResponse(BaseModel):
    success: bool = True
    stats: DashboardQuickStats
    health: SystemQuickHealth
    recent_activity: List[DashboardRecentItem] = Field(default_factory=list)
    recent_jobs: List[Dict[str, Any]] = Field(default_factory=list)
    environment: str = "development"
