"""
backend/features/profile/router/avatar.py
─────────────────────────────────────────────────────────────────────────────
User Avatar management endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, UploadFile, File, Request
from app.core.dependencies.auth import get_current_user
from common import get_client_ip
from features.profile.services.avatar_service import upload_avatar, refresh_youtube_avatar

logger = logging.getLogger("sonikoma.features.profile.avatar")
router = APIRouter()


@router.post("/avatar/upload", summary="Upload custom avatar image")
async def upload_avatar_endpoint(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    ip_addr = get_client_ip(request)
    file_bytes = await file.read()
    return await upload_avatar(
        user_id=current_user["user_id"],
        file_bytes=file_bytes,
        filename=file.filename or "avatar.png",
        content_type=file.content_type or "image/png",
        ip_addr=ip_addr,
    )


@router.post("/avatar/youtube-refresh", summary="Refresh YouTube channel avatar logo")
async def refresh_youtube_avatar_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Re-fetch the YouTube channel logo using the stored Google access token
    and update the user's avatar_url in the database.
    """
    ip_addr = get_client_ip(request)
    return refresh_youtube_avatar(
        user_id=current_user["user_id"],
        current_user=current_user,
        ip_addr=ip_addr,
    )


__all__ = ["router"]
