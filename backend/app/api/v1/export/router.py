"""
api/v1/export/router.py
─────────────────────────────────────────────────────────────────────────────
Primary export router mounting the sub-routers and history route.
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException, Depends

from api.dependencies.auth import get_current_user
from database.db import get_youtube_publications
from api.v1.export.youtube import router as youtube_router
from api.v1.export.profiles import router as profiles_router
from api.v1.export.credentials import router as credentials_router

logger = logging.getLogger("sonikoma.api.export.router")
export_router = APIRouter()

# Mount sub-routers
export_router.include_router(youtube_router)
export_router.include_router(profiles_router)
export_router.include_router(credentials_router)


@export_router.get("/youtube/history", summary="Get YouTube video upload history")
async def api_get_youtube_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("id")
    try:
        history = get_youtube_publications(user_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"[YouTube History] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))
