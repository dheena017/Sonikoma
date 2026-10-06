"""
backend/app/features/platform/shell/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FastAPI router for platform shell configuration, layout state, and workspace navigation.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies.auth import get_optional_current_user, get_current_user
from app.core.config import API_VERSION, NODE_ENV
from .schemas import ShellConfigResponse, NavItem, ShellPreferencesUpdate, ShellStateResponse

logger = logging.getLogger("sonikoma.features.platform.shell")

router = APIRouter(prefix="/shell", tags=["Platform Shell"])

# Default navigation items mirroring frontend platform shell
DEFAULT_NAV_ITEMS = [
    NavItem(id="dashboard", label="Dashboard", icon="layout-dashboard", path="/platform/dashboard", section="main", order=1),
    NavItem(id="projects", label="Projects", icon="folder-kanban", path="/platform/projects", section="main", order=2),
    NavItem(id="scraper", label="Webtoon Scraper", icon="globe", path="/platform/scraper", section="tools", order=3),
    NavItem(id="jobs", label="Job Monitor", icon="activity", path="/platform/jobs", section="tools", order=4),
    NavItem(id="terminal", label="Developer Terminal", icon="terminal", path="/platform/terminal", section="dev", order=5, roles=["admin"]),
    NavItem(id="shortcuts", label="Keyboard Shortcuts", icon="keyboard", path="/platform/shortcuts", section="settings", order=6),
    NavItem(id="settings", label="System Settings", icon="settings", path="/platform/settings", section="settings", order=7),
]

_IN_MEMORY_PREFERENCES: Dict[str, Dict[str, Any]] = {}


@router.get(
    "/config",
    response_model=ShellConfigResponse,
    summary="Get platform shell configuration and navigation schema",
    description="Returns global shell metadata, navigation items matching user role, and active feature flags."
)
async def get_shell_config(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_role = current_user.get("role", "user") if current_user else "user"
    
    # Filter navigation items by role
    filtered_nav = [
        item for item in DEFAULT_NAV_ITEMS
        if user_role in item.roles or "user" in item.roles
    ]

    return ShellConfigResponse(
        version=API_VERSION,
        navigation=filtered_nav,
        features_enabled={
            "terminal": True,
            "jobs_stream": True,
            "ai_generation": True,
            "supabase_sync": True,
            "notifications": True
        },
        default_route="/platform/dashboard",
        environment=NODE_ENV
    )


@router.get(
    "/state",
    response_model=ShellStateResponse,
    summary="Get user shell state and layout preferences"
)
async def get_shell_state(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    user_prefs = _IN_MEMORY_PREFERENCES.get(user_id, {})
    return ShellStateResponse(
        sidebar_collapsed=user_prefs.get("sidebar_collapsed", False),
        active_theme=user_prefs.get("active_theme", "dark"),
        pinned_nav_ids=user_prefs.get("pinned_nav_ids", ["dashboard", "projects"]),
        developer_mode=user_prefs.get("developer_mode", False),
        preferences=user_prefs.get("preferences", {})
    )


@router.post(
    "/preferences",
    response_model=ShellStateResponse,
    summary="Update user shell state and layout preferences"
)
async def update_shell_preferences(
    body: ShellPreferencesUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    current_prefs = _IN_MEMORY_PREFERENCES.setdefault(user_id, {
        "sidebar_collapsed": False,
        "active_theme": "dark",
        "pinned_nav_ids": ["dashboard", "projects"],
        "developer_mode": False,
        "preferences": {}
    })
    
    if body.sidebar_collapsed is not None:
        current_prefs["sidebar_collapsed"] = body.sidebar_collapsed
    if body.active_theme is not None:
        current_prefs["active_theme"] = body.active_theme
    if body.pinned_nav_ids is not None:
        current_prefs["pinned_nav_ids"] = body.pinned_nav_ids
    if body.developer_mode is not None:
        current_prefs["developer_mode"] = body.developer_mode
    if body.preferences is not None:
        current_prefs["preferences"].update(body.preferences)
        
    return ShellStateResponse(**current_prefs)

