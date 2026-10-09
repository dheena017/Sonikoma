"""
backend/features/creative/thumbnails/router.py
─────────────────────────────────────────────────────────────────────────────
FastAPI Router for the AI Thumbnail Generator Studio:
- POST /api/v1/creative/thumbnails/generate -> Generates 3 or 6 high-CTR thumbnails
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.creative.thumbnails.schemas import (
    ThumbnailGenerateRequest,
    ThumbnailGenerateResponse,
)
from features.creative.thumbnails.service import thumbnail_service

logger = logging.getLogger("sonikoma.creative.thumbnails.router")
router = APIRouter()


@router.post(
    "/generate",
    response_model=ThumbnailGenerateResponse,
    summary="Generate High-CTR 16:9 YouTube Thumbnail",
)
async def generate_thumbnails_endpoint(request: ThumbnailGenerateRequest):
    """
    Takes an AI prompt and comic panel references, maps character visuals
    and cinematic lighting, and generates a high-CTR 16:9 YouTube thumbnail.
    """
    try:
        response = await thumbnail_service.generate_thumbnail(request)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Thumbnail Router] Generation error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


thumbnails_router = router
__all__ = ["thumbnails_router", "router"]
