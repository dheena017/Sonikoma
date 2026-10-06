"""
backend/features/creative/export/router.py
─────────────────────────────────────────────────────────────────────────────
Primary export router mounting the sub-routers and history route.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException, Depends

from typing import Optional
from app.core.dependencies.auth import get_current_user, get_optional_current_user
from features.creative.export.youtube import router as youtube_router
from features.creative.export.profiles import router as profiles_router
from features.creative.export.credentials import router as credentials_router
from features.creative.export.service import export_service

logger = logging.getLogger("sonikoma.creative.export.router")
export_router = APIRouter()

# Mount sub-routers
export_router.include_router(youtube_router)
export_router.include_router(profiles_router, prefix="/youtube")
export_router.include_router(credentials_router, prefix="/youtube")


@export_router.get("/youtube/history", summary="Get YouTube video upload history")
async def get_youtube_history_endpoint(current_user: Optional[dict] = Depends(get_optional_current_user)):
    user_id = (current_user.get("id") or current_user.get("user_id")) if current_user else "anonymous"
    try:
        history = export_service.get_publishing_history(user_id)
        return {"history": history}
    except Exception as e:
        logger.error(f"[YouTube History] Error fetching: {e}")
        raise HTTPException(status_code=500, detail=str(e))


router = export_router

__all__ = ["export_router", "router"]
