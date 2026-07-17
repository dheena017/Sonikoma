"""
backend/app/api/v1/auth/avatar.py
─────────────────────────────────────────────────────────────────────────────
User Avatar management endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from api.dependencies.auth import get_current_user
from services.image.upload import upload_image_service
from repositories.user_repository import update_user, write_audit_log

logger = logging.getLogger("sonikoma.auth.avatar")
router = APIRouter()


@router.post("/avatar/upload")
async def upload_avatar(
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
