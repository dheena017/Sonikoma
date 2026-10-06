"""
backend/app/features/platform/shortcuts/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FastAPI router for platform keyboard shortcuts registry and user customization.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, Depends

from app.core.dependencies.auth import get_optional_current_user, get_current_user
from .schemas import (
    ShortcutItem,
    ShortcutListResponse,
    ShortcutUpdateRequest,
    ShortcutUpdateResponse
)

logger = logging.getLogger("sonikoma.features.platform.shortcuts")

router = APIRouter(prefix="/shortcuts", tags=["Platform Shortcuts"])

DEFAULT_SHORTCUTS: List[ShortcutItem] = [
    ShortcutItem(id="cmd_palette", action="Open Command Palette", description="Quick actions and navigation", category="navigation", default_keys=["Ctrl", "K"]),
    ShortcutItem(id="toggle_sidebar", action="Toggle Sidebar", description="Expand or collapse navigation drawer", category="navigation", default_keys=["Ctrl", "B"]),
    ShortcutItem(id="toggle_terminal", action="Toggle Terminal", description="Open or close developer terminal drawer", category="system", default_keys=["Ctrl", "`"]),
    ShortcutItem(id="quick_save", action="Save Changes", description="Save active project or storyboard changes", category="editor", default_keys=["Ctrl", "S"]),
    ShortcutItem(id="undo", action="Undo", description="Revert last editor modification", category="editor", default_keys=["Ctrl", "Z"]),
    ShortcutItem(id="redo", action="Redo", description="Reapply reverted modification", category="editor", default_keys=["Ctrl", "Y"]),
    ShortcutItem(id="split_panel", action="Split Panel", description="Divide selected panel horizontally", category="editor", default_keys=["Ctrl", "D"]),
    ShortcutItem(id="ocr_detect", action="Run OCR", description="Detect and extract speech bubbles in panel", category="editor", default_keys=["Ctrl", "Shift", "O"]),
    ShortcutItem(id="play_pause", action="Play / Pause", description="Toggle video preview playback", category="playback", default_keys=["Space"]),
    ShortcutItem(id="next_frame", action="Next Frame", description="Step preview forward by 1 frame", category="playback", default_keys=["ArrowRight"]),
    ShortcutItem(id="prev_frame", action="Previous Frame", description="Step preview backward by 1 frame", category="playback", default_keys=["ArrowLeft"]),
]

_USER_CUSTOM_BINDINGS: Dict[str, Dict[str, List[str]]] = {}


@router.get(
    "/",
    response_model=ShortcutListResponse,
    summary="List all platform keyboard shortcuts",
    description="Returns full shortcut catalog with defaults and custom overrides for the active user session."
)
async def list_shortcuts(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    user_custom = _USER_CUSTOM_BINDINGS.get(user_id, {})
    
    categories = sorted(list(set(s.category for s in DEFAULT_SHORTCUTS)))
    result: List[ShortcutItem] = []
    for s in DEFAULT_SHORTCUTS:
        item = s.copy()
        if item.id in user_custom:
            item.custom_keys = user_custom[item.id]
        result.append(item)
        
    return ShortcutListResponse(
        success=True,
        categories=categories,
        shortcuts=result
    )


@router.post(
    "/custom",
    response_model=ShortcutUpdateResponse,
    summary="Save user custom keyboard shortcuts",
    description="Overrides default keybindings for the authenticated user session."
)
async def save_custom_shortcuts(
    body: ShortcutUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    bindings = _USER_CUSTOM_BINDINGS.setdefault(user_id, {})
    bindings.update(body.custom_bindings)
    
    return ShortcutUpdateResponse(
        success=True,
        message="Custom keyboard shortcuts saved successfully",
        updated_count=len(body.custom_bindings)
    )


@router.delete(
    "/custom",
    response_model=ShortcutUpdateResponse,
    summary="Reset custom keyboard shortcuts to defaults",
    description="Clears all custom user keybindings and reverts to default system mappings."
)
async def reset_custom_shortcuts(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_id = current_user.get("user_id") or current_user.get("id") or "anonymous"
    if user_id in _USER_CUSTOM_BINDINGS:
        del _USER_CUSTOM_BINDINGS[user_id]
        
    return ShortcutUpdateResponse(
        success=True,
        message="Shortcuts reverted to system defaults",
        updated_count=0
    )

