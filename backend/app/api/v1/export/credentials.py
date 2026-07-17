"""
api/v1/export/credentials.py
─────────────────────────────────────────────────────────────────────────────
API endpoints for managing user YouTube OAuth credentials.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from backend.schemas.export import YouTubeCredentialsRequest
from database.db import save_youtube_credentials, get_youtube_credentials, delete_youtube_credentials

logger = logging.getLogger("sonikoma.api.export.credentials")
router = APIRouter()


@router.get("/credentials", summary="Get status of YouTube custom credentials")
async def api_get_youtube_credentials(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        creds = get_youtube_credentials(user_id)
        if creds:
            return {
                "has_credentials": True,
                "client_id": creds["client_id"],
                "project_id": creds["project_id"],
                "updated_at": creds["updated_at"],
            }
        return {"has_credentials": False}
    except Exception as e:
        logger.error(f"[YouTube Credentials] Error checking: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/credentials", summary="Save user YouTube OAuth credentials")
async def api_save_youtube_credentials(
    creds_req: YouTubeCredentialsRequest, current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("id")
    try:
        saved = save_youtube_credentials(
            user_id=user_id,
            client_id=creds_req.client_id.strip(),
            client_secret=creds_req.client_secret.strip(),
            project_id=creds_req.project_id.strip(),
        )
        return {
            "status": "success",
            "message": "Custom credentials saved successfully",
            "client_id": saved["client_id"],
            "project_id": saved["project_id"],
        }
    except Exception as e:
        logger.error(f"[YouTube Credentials] Error saving: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/credentials", summary="Remove user YouTube OAuth credentials")
async def api_delete_youtube_credentials(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        deleted = delete_youtube_credentials(user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="No custom credentials found to delete")
        return {"status": "success", "message": "Custom credentials removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[YouTube Credentials] Error deleting: {e}")
        raise HTTPException(status_code=500, detail=str(e))
