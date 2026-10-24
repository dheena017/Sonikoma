"""
backend/features/video/router/subtitles.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for hardcoded subtitle burning into video frames.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.core.dependencies.auth import get_optional_current_user
from features.video.schemas import SubtitlesRequest
from features.video.operations.subtitle_burn_service import burn_subtitles

router = APIRouter()


@router.post("/burn", summary="Burn subtitles into video file")
async def burn_subtitles_endpoint(
    request: SubtitlesRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Burns styled subtitles permanently into video frames."""
    try:
        out = await burn_subtitles(
            video_path=request.video_path,
            subtitle_path=request.subtitle_path,
            output_path=request.output_path,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
