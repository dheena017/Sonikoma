"""
backend/python/routes/ffmpeg_routes.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg route layer for advanced video editing and audio extraction.
"""

import os
import sys
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from media.video.ffmpeg_engine import (
    get_ffmpeg_engine,
    CutSpec,
    TransitionSpec,
    FilterType,
)

logger = logging.getLogger("sonikoma.routes.ffmpeg_routes")
router = APIRouter()
ffmpeg = get_ffmpeg_engine()


class MetadataRequest(BaseModel):
    video_path: str


class CutSpecRequest(BaseModel):
    start_time: float = Field(..., ge=0.0)
    end_time: float = Field(..., gt=0.0)
    fade_in: Optional[float] = 0.0
    fade_out: Optional[float] = 0.0


class CutVideoRequest(BaseModel):
    video_path: str
    cuts: List[CutSpecRequest]
    output_path: Optional[str] = None


class ExtractAudioRequest(BaseModel):
    video_path: str
    output_path: Optional[str] = None
    format: Optional[str] = "mp3"
    bitrate: Optional[str] = "192k"


class MixAudioRequest(BaseModel):
    video_path: str
    audio_paths: List[str]
    audio_volumes: Optional[List[float]] = None
    output_path: Optional[str] = None


class SubtitlesRequest(BaseModel):
    video_path: str
    subtitle_path: str
    output_path: Optional[str] = None


class ApplyFilterRequest(BaseModel):
    video_path: str
    filter_type: FilterType
    intensity: Optional[float] = 1.0
    output_path: Optional[str] = None


class AdjustSpeedRequest(BaseModel):
    video_path: str
    speed_factor: float = Field(..., gt=0.0)
    preserve_pitch: Optional[bool] = True
    output_path: Optional[str] = None


class ConcatenateVideosRequest(BaseModel):
    video_paths: List[str]
    output_path: Optional[str] = None
    fps: Optional[int] = 24
    width: Optional[int] = 1920
    height: Optional[int] = 1080


class TransitionSpecRequest(BaseModel):
    type: str
    duration: Optional[float] = 1.0
    start_frame: Optional[int] = None


class ConcatenateWithTransitionsRequest(BaseModel):
    video_paths: List[str]
    transitions: Optional[List[TransitionSpecRequest]] = None
    output_path: Optional[str] = None
    fps: Optional[int] = 24
    width: Optional[int] = 1920
    height: Optional[int] = 1080


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}{suffix}")


@router.post("/metadata", summary="Extract video metadata")
async def get_metadata(body: MetadataRequest):
    try:
        metadata = await ffmpeg.get_metadata(body.video_path)
        return {"success": True, "metadata": metadata.__dict__}
    except Exception as exc:
        logger.error(f"Metadata extraction failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/cut", summary="Cut video into segments")
async def cut_video(body: CutVideoRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        cuts = [CutSpec(**cut.dict()) for cut in body.cuts]
        result = await ffmpeg.cut_video(body.video_path, cuts, output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Cut video failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-audio", summary="Extract audio from a video file")
async def extract_audio(body: ExtractAudioRequest):
    output_path = body.output_path or _default_output_path(f".{body.format}")
    try:
        result = await ffmpeg.extract_audio(body.video_path, output_path, format=body.format, bitrate=body.bitrate)
        return {"success": True, "audio_path": result}
    except Exception as exc:
        logger.error(f"Extract audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/mix-audio", summary="Mix multiple audio tracks into a video")
async def mix_audio(body: MixAudioRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        result = await ffmpeg.mix_audio(body.video_path, body.audio_paths, audio_volumes=body.audio_volumes, output_path=output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Mix audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/add-subtitles", summary="Burn subtitles into a video")
async def add_subtitles(body: SubtitlesRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        result = await ffmpeg.add_subtitles(body.video_path, body.subtitle_path, output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Add subtitles failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/apply-filter", summary="Apply a visual filter to a video")
async def apply_filter(body: ApplyFilterRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        result = await ffmpeg.apply_filter(body.video_path, output_path, body.filter_type, body.intensity)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Apply filter failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/adjust-speed", summary="Adjust video playback speed")
async def adjust_speed(body: AdjustSpeedRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        result = await ffmpeg.adjust_speed(body.video_path, output_path, speed_factor=body.speed_factor, preserve_pitch=body.preserve_pitch)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Adjust speed failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/concatenate", summary="Concatenate multiple video files")
async def concatenate_videos(body: ConcatenateVideosRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        result = await ffmpeg.concatenate_videos(body.video_paths, output_path, fps=body.fps, width=body.width, height=body.height)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Concatenate videos failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/concatenate-with-transitions", summary="Concatenate videos with transitions")
async def concatenate_videos_with_transitions(body: ConcatenateWithTransitionsRequest):
    output_path = body.output_path or _default_output_path(".mp4")
    try:
        transitions = []
        if body.transitions:
            for transition in body.transitions:
                transitions.append(TransitionSpec(**transition.dict()))
        result = await ffmpeg.concatenate_videos(body.video_paths, output_path, transitions=transitions, fps=body.fps, width=body.width, height=body.height)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Concatenate with transitions failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
