"""
backend/app/api/v1/video/ffmpeg.py
─────────────────────────────────────────────────────────────────────────────
FastAPI routes for specific FFmpeg tasks: cutting, filters, subtitles, speed, etc.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from fastapi import APIRouter, HTTPException

from engines.ffmpeg import (
    get_ffmpeg_engine,
    CutSpec,
    TransitionSpec
)
from schemas.video import (
    MetadataRequest,
    CutVideoRequest,
    ExtractAudioRequest,
    MixAudioRequest,
    SubtitlesRequest,
    ApplyFilterRequest,
    AdjustSpeedRequest,
    ConcatenateVideosRequest,
    ConcatenateWithTransitionsRequest
)

logger = logging.getLogger("sonikoma.api.video.ffmpeg")
router = APIRouter()
ffmpeg = get_ffmpeg_engine()


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
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        cuts = [CutSpec(start_time=cut.start_time, end_time=cut.end_time, fade_in=cut.fade_in, fade_out=cut.fade_out) for cut in body.cuts]
        result = await ffmpeg.cut_video(body.video_path, cuts, output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Cut video failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-audio", summary="Extract audio from a video file")
async def extract_audio(body: ExtractAudioRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.{body.format}")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.extract_audio(body.video_path, output_path, format=body.format, bitrate=body.bitrate)
        return {"success": True, "audio_path": result}
    except Exception as exc:
        logger.error(f"Extract audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/mix-audio", summary="Mix multiple audio tracks into a video")
async def mix_audio(body: MixAudioRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.mix_audio(body.video_path, body.audio_paths, audio_volumes=body.audio_volumes, output_path=output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Mix audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/add-subtitles", summary="Burn subtitles into a video")
async def add_subtitles(body: SubtitlesRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.add_subtitles(body.video_path, body.subtitle_path, output_path)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Add subtitles failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/apply-filter", summary="Apply a visual filter to a video")
async def apply_filter(body: ApplyFilterRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.apply_filter(body.video_path, output_path, body.filter_type, body.intensity)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Apply filter failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/adjust-speed", summary="Adjust video playback speed")
async def adjust_speed(body: AdjustSpeedRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.adjust_speed(body.video_path, output_path, speed_factor=body.speed_factor, preserve_pitch=body.preserve_pitch)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Adjust speed failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/concatenate", summary="Concatenate multiple video files")
async def concatenate_videos(body: ConcatenateVideosRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        result = await ffmpeg.concatenate_videos(body.video_paths, output_path, fps=body.fps, width=body.width, height=body.height)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Concatenate videos failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/concatenate-with-transitions", summary="Concatenate videos with transitions")
async def concatenate_videos_with_transitions(body: ConcatenateWithTransitionsRequest):
    output_dir = os.path.join(tempfile.gettempdir(), f"ffmpeg_{os.urandom(4).hex()}.mp4")
    output_path = body.output_path or output_dir
    try:
        transitions = []
        if body.transitions:
            for transition in body.transitions:
                transitions.append(TransitionSpec(type=transition.type, duration=transition.duration, start_frame=transition.start_frame))
        result = await ffmpeg.concatenate_videos(body.video_paths, output_path, transitions=transitions, fps=body.fps, width=body.width, height=body.height)
        return {"success": True, "output_path": result}
    except Exception as exc:
        logger.error(f"Concatenate with transitions failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
