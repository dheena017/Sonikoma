"""
backend/app/features/platform/shortcuts/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for platform keyboard shortcut registry and custom user keybindings.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field


class ShortcutItem(BaseModel):
    id: str
    action: str
    description: str
    category: str  # navigation, editor, playback, system
    default_keys: List[str]
    custom_keys: Optional[List[str]] = None
    enabled: bool = True


class ShortcutListResponse(BaseModel):
    success: bool = True
    categories: List[str]
    shortcuts: List[ShortcutItem]


class ShortcutUpdateRequest(BaseModel):
    custom_bindings: Dict[str, List[str]] = Field(
        ...,
        description="Map of shortcut ID to list of keys (e.g. {'toggle_terminal': ['Ctrl', '`']})"
    )


class ShortcutUpdateResponse(BaseModel):
    success: bool = True
    message: str
    updated_count: int
