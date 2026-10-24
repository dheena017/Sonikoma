"""
backend/features/video/router/metadata.py
─────────────────────────────────────────────────────────────────────────────
Endpoints for technical stream and container inspection via ffprobe.
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional

from app.core.dependencies.auth import get_optional_current_user
from features.video.schemas import MetadataRequest
from features.video.operations.probe_service import get_video_info

router = APIRouter()


@router.post("/metadata", summary="Inspect video container metadata")
async def inspect_metadata_endpoint(
    request: MetadataRequest,
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Probes technical stream metadata (codec, bitrate, resolution, audio sample rate)."""
    try:
        out = await get_video_info(video_path=request.video_path)
        return {"success": True, "metadata": out}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


__all__ = ["router"]
