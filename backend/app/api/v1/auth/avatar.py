"""
backend/app/api/v1/auth/avatar.py
─────────────────────────────────────────────────────────────────────────────
User Avatar management endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import requests as http_requests
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from api.dependencies.auth import get_current_user
from services.image.upload.image_uploader import upload_image_service
from repositories.user import update_user, write_audit_log, get_user_by_id

logger = logging.getLogger("sonikoma.auth.avatar")
router = APIRouter()


@router.post("/avatar/upload", summary="Upload custom avatar image")
async def upload_avatar_endpoint(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    ip_addr = request.client.host if request.client else "127.0.0.1"
    try:
        file_bytes = await file.read()
        res = await upload_image_service(file_bytes, file.filename, file.content_type)
        if not res.get("success"):
            raise HTTPException(status_code=400, detail="Avatar upload failed")

        avatar_url = res["url"]
        update_user(current_user["user_id"], {"avatar_url": avatar_url})
        write_audit_log(current_user["user_id"], "Uploaded avatar image", ip_addr, "Success")
        return {"success": True, "avatar_url": avatar_url}
    except Exception as e:
        logger.error(f"Failed to upload avatar: {e}")
        write_audit_log(current_user["user_id"], "Failed to upload avatar", ip_addr, "Failure")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/avatar/youtube-refresh", summary="Refresh YouTube channel avatar logo")
async def refresh_youtube_avatar_endpoint(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Re-fetch the YouTube channel logo using the stored Google access token
    and update the user's avatar_url in the database.
    No re-login required as long as the stored token is still valid.
    """
    ip_addr = request.client.host if request.client else "127.0.0.1"
    user_id = current_user["user_id"]

    # Reload user from DB to get the stored google_access_token
    user_record = get_user_by_id(user_id)
    google_token = (user_record or {}).get("google_access_token") or current_user.get("google_access_token")

    if not google_token:
        raise HTTPException(
            status_code=400,
            detail="No Google access token stored. Please sign out and sign in again with Google."
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
                detail="Google access token expired. Please sign out and sign in again with Google."
            )

        if yt_resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"YouTube API returned {yt_resp.status_code}: {yt_resp.text[:300]}"
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

