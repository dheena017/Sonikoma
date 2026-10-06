"""
backend/app/features/platform/shell/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for platform shell navigation, layout state, and user preferences.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NavItem(BaseModel):
    id: str
    label: str
    icon: str
    path: str
    badge: Optional[str] = None
    section: str = "main"
    order: int = 0
    roles: List[str] = Field(default_factory=lambda: ["user", "admin"])


class ShellConfigResponse(BaseModel):
    version: str
    navigation: List[NavItem]
    features_enabled: Dict[str, bool]
    default_route: str = "/platform/dashboard"
    environment: str


class ShellPreferencesUpdate(BaseModel):
    sidebar_collapsed: Optional[bool] = None
    active_theme: Optional[str] = None
    pinned_nav_ids: Optional[List[str]] = None
    developer_mode: Optional[bool] = None
    preferences: Optional[Dict[str, Any]] = None


class ShellStateResponse(BaseModel):
    sidebar_collapsed: bool = False
    active_theme: str = "dark"
    pinned_nav_ids: List[str] = Field(default_factory=list)
    developer_mode: bool = False
    preferences: Dict[str, Any] = Field(default_factory=dict)
