"""
backend/features/video/router/clip.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for clip trimming, concatenation, filtering, speed, and thumbnails.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.core.dependencies.auth import get_optional_current_user
from features.video.schemas import (
    CutVideoRequest,
    ConcatenateVideosRequest,
    ApplyFilterRequest,
    AdjustSpeedRequest,
)
from features.video.operations.cutter_service import cut_video
from features.video.operations.concat_service import concat_videos
from features.video.operations.filter_service import apply_filter
from features.video.operations.speed_service import change_speed
from features.video.operations.thumbnail_service import get_thumbnail

router = APIRouter()


@router.post("/cut", summary="Cut/trim video segment")
async def cut_video_endpoint(
    request: CutVideoRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Trims video segment between start and end timestamps."""
    if not request.cuts:
        raise HTTPException(status_code=400, detail="No cut specifications provided.")
    try:
        first_cut = request.cuts[0]
        out = await cut_video(
            video_path=request.video_path,
            start_time=first_cut.start_time,
            end_time=first_cut.end_time,
            output_path=request.output_path,
            fade_in=first_cut.fade_in or 0.0,
            fade_out=first_cut.fade_out or 0.0,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/concatenate", summary="Concatenate multiple video files")
async def concat_videos_endpoint(
    request: ConcatenateVideosRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Concatenates multiple video files into a unified output."""
    if not request.video_paths:
        raise HTTPException(status_code=400, detail="Video path list is empty.")
    try:
        out = await concat_videos(
            video_paths=request.video_paths,
            output_path=request.output_path,
            fps=request.fps or 24,
            width=request.width or 1920,
            height=request.height or 1080,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filter", summary="Apply visual filter to video")
async def apply_filter_endpoint(
    request: ApplyFilterRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Applies FFmpeg visual shaders and grading filters to video."""
    try:
        out = await apply_filter(
            video_path=request.video_path,
            filter_type=str(request.filter_type),
            intensity=request.intensity or 1.0,
            output_path=request.output_path,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/speed", summary="Adjust video playback speed")
async def adjust_speed_endpoint(
    request: AdjustSpeedRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Scales video speed with pitch preservation."""
    try:
        out = await change_speed(
            video_path=request.video_path,
            speed_factor=request.speed_factor,
            preserve_pitch=request.preserve_pitch is not False,
            output_path=request.output_path,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/thumbnail", summary="Extract keyframe video thumbnail")
async def get_thumbnail_endpoint(
    video_path: str,
    timestamp: Optional[float] = 1.0,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Captures keyframe still from video file."""
    try:
        out = await get_thumbnail(video_path=video_path, timestamp_seconds=timestamp)
        return {"success": True, "thumbnail_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
