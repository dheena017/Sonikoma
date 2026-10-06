"""
backend/features/profile/services/avatar_service.py
─────────────────────────────────────────────────────────────────────────────
Avatar image upload and external OAuth (YouTube) avatar sync services.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, Dict
import requests as http_requests
from fastapi import HTTPException

from features.auth.repositories import (
    update_user,
    get_user_by_id,
    write_audit_log,
)
from features.image_editor.services.upload.image_uploader import upload_image_service

logger = logging.getLogger("sonikoma.features.profile.services.avatar")


async def upload_avatar(
    user_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Upload custom avatar image to storage and update user profile."""
    try:
        res = await upload_image_service(file_bytes, filename, content_type)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail="Avatar upload failed")

        avatar_url = res["url"]
        update_user(user_id, {"avatar_url": avatar_url})
        write_audit_log(user_id, "Uploaded avatar image", ip_addr, "Success")
        return {"success": True, "avatar_url": avatar_url}
    except Exception as e:
        logger.error(f"Failed to upload avatar: {e}")
        write_audit_log(user_id, "Failed to upload avatar", ip_addr, "Failure")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))


def refresh_youtube_avatar(
    user_id: str,
    current_user: dict,
    ip_addr: str = "127.0.0.1",
) -> Dict[str, Any]:
    """Refresh YouTube avatar logo using Google OAuth access token."""
    user_record = get_user_by_id(user_id)
    google_token = (user_record or {}).get("google_access_token") or current_user.get("google_access_token")

    if not google_token:
        raise HTTPException(
            status_code=400,
            detail="No Google access token stored. Please sign out and sign in again with Google.",
        )

    try:
        yt_resp = http_requests.get(
            "https://www.googleapis.com/youtube/v3/channels?mine=true&part=snippet",
            headers={"Authorization": f"Bearer {google_token}"},
            timeout=8,
        )
        logger.info("YouTube refresh API status: %d", yt_resp.status_code)

        if yt_resp.status_code == 401:
            raise HTTPException(
                status_code=401,
                detail="Google access token expired. Please sign out and sign in again with Google.",
            )

        if yt_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"YouTube API returned {yt_resp.status_code}: {yt_resp.text[:300]}",
            )

        yt_data = yt_resp.json()
        items = yt_data.get("items", [])
        logger.info("YouTube refresh returned %d item(s)", len(items) if items else 0)

        if not items:
            return {
                "success": False,
                "message": "No YouTube channel found for this Google account.",
                "avatar_url": current_user.get("avatar_url"),
            }

        snippet = items[0].get("snippet", {})
        thumbnails = snippet.get("thumbnails", {})
        yt_img = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
        )

        if not yt_img:
            return {
                "success": False,
                "message": "YouTube channel found but no thumbnail URL available.",
                "avatar_url": current_user.get("avatar_url"),
            }

        update_user(user_id, {"avatar_url": yt_img})
        write_audit_log(user_id, "Refreshed YouTube channel avatar", ip_addr, "Success")
        logger.info("YouTube avatar refreshed for user %s: %s", user_id, yt_img)
        return {"success": True, "avatar_url": yt_img}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("YouTube avatar refresh failed for %s: %s", user_id, e)
        raise HTTPException(status_code=500, detail=f"YouTube avatar refresh failed: {e}")
