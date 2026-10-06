"""
backend/app/features/platform/notifications/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for the platform user notification system.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class NotificationItem(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, success, warning, error
    read: bool = False
    created_at: str
    link: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class NotificationListResponse(BaseModel):
    success: bool = True
    unread_count: int = 0
    total: int = 0
    notifications: List[NotificationItem] = Field(default_factory=list)


class NotificationActionResponse(BaseModel):
    success: bool = True
    message: str
