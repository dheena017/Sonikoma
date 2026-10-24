"""
backend/features/video/router/audio.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for extracting audio tracks from video and mixing external audio.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.core.dependencies.auth import get_optional_current_user
from features.video.schemas import ExtractAudioRequest, MixAudioRequest
from features.video.operations.audio_merge_service import (
    extract_audio,
    mix_audio,
)

router = APIRouter()


@router.post("/extract-audio", summary="Extract audio track from video")
async def extract_audio_endpoint(
    request: ExtractAudioRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Demuxes audio stream from video container."""
    try:
        out = await extract_audio(
            video_path=request.video_path,
            output_path=request.output_path,
            format_str=request.format or "mp3",
            bitrate=request.bitrate or "192k",
        )
        return {"success": True, "audio_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mix-audio", summary="Mix audio stems into video")
async def mix_audio_endpoint(
    request: MixAudioRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Mixes external audio stems into video file."""
    try:
        out = await mix_audio(
            video_path=request.video_path,
            audio_paths=request.audio_paths,
            audio_volumes=request.audio_volumes,
            output_path=request.output_path,
        )
        return {"success": True, "output_path": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
