"""
backend/app/features/platform/notifications/router.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FastAPI router for user notifications management and alert status polling.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies.auth import get_optional_current_user, get_current_user
from .schemas import NotificationListResponse, NotificationActionResponse
from .service import notification_service

logger = logging.getLogger("sonikoma.features.platform.notifications")

router = APIRouter(prefix="/notifications", tags=["Platform Notifications"])


@router.get(
    "/",
    response_model=NotificationListResponse,
    summary="List user notifications",
    description="Returns notifications for the active user, including unread counts."
)
async def list_notifications(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    return notification_service.list_notifications(user_id=user_id)


@router.post(
    "/{notif_id}/read",
    response_model=NotificationActionResponse,
    summary="Mark a specific notification as read"
)
async def mark_notification_read(
    notif_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    success = notification_service.mark_read(user_id, notif_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationActionResponse(success=True, message="Notification marked as read")


@router.post(
    "/read-all",
    response_model=NotificationActionResponse,
    summary="Mark all notifications as read"
)
async def mark_all_notifications_read(
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    count = notification_service.mark_all_read(user_id)
    return NotificationActionResponse(success=True, message=f"{count} notifications marked as read")


@router.delete(
    "/clear",
    response_model=NotificationActionResponse,
    summary="Clear all notifications"
)
async def clear_notifications(
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)
):
    user_id = (current_user.get("user_id") or current_user.get("id")) if current_user else "anonymous"
    notification_service.clear_all(user_id)
    return NotificationActionResponse(success=True, message="All notifications cleared")

