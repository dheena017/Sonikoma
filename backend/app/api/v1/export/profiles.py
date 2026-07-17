import logging
from fastapi import APIRouter, HTTPException, Depends
from api.dependencies.auth import get_current_user
from schemas.export import YouTubeProfileRequest
from database.db import (
    get_youtube_profiles,
    save_youtube_profile,
    delete_youtube_profile,
    get_youtube_publications,
)

router = APIRouter()
logger = logging.getLogger("sonikoma.api.export.profiles")


@router.get("/youtube/profiles", summary="Get custom YouTube publishing profiles")
async def api_get_youtube_profiles(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        profiles = get_youtube_profiles(user_id)
        return {"profiles": profiles}
    except Exception as e:
        logger.error(f"[YouTube Profiles] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/youtube/profiles", summary="Save or overwrite a YouTube publishing profile")
async def api_save_youtube_profile(
    profile_req: YouTubeProfileRequest, current_user: dict = Depends(get_current_user)
):
    user_id = current_user.get("id")
    try:
        profile_data = profile_req.dict()
        saved = save_youtube_profile(user_id, profile_data)
        return {"status": "success", "profile": saved}
    except Exception as e:
        logger.error(f"[YouTube Profiles] Error saving: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/youtube/profiles/{name}", summary="Delete a YouTube publishing profile")
async def api_delete_youtube_profile(name: str, current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        deleted = delete_youtube_profile(user_id, name)
        if not deleted:
            raise HTTPException(status_code=404, detail="Profile not found")
        return {"status": "success", "message": f"Profile '{name}' deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[YouTube Profiles] Error deleting: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/youtube/history", summary="Get YouTube video upload history")
async def api_get_youtube_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        history = get_youtube_publications(user_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"[YouTube History] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))
