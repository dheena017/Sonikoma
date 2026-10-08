"""
backend/app/api/v1/providers/whisper.py
─────────────────────────────────────────────────────────────────────────────
OpenAI Whisper Speech-to-Text & Subtitle Provider API Routes:
- GET  /status     – Whisper engine & model availability
- POST /transcribe – Transcribe audio file to text with segments and timestamps
- POST /subtitles  – Convert audio transcription to SRT or WebVTT subtitles
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ai_engine.providers.whisper import (
    WhisperEngine,
    WhisperClient,
    get_whisper_engine,
    WHISPER_AVAILABLE,
    WhisperModel,
)
from ai_engine.providers.whisper.helpers import segments_to_srt, segments_to_vtt
from features.video_editor.audio.schemas import TranscribeRequest, SubtitleRequest

logger = logging.getLogger("sonikoma.api.providers.whisper")
router = APIRouter()


class WhisperSubtitlesRequest(BaseModel):
    audio_path: str
    format: Optional[str] = "srt"  # "srt" or "vtt"
    model_name: Optional[str] = "base"
    language: Optional[str] = None


@router.get("/status", summary="Check Whisper speech-to-text provider status")
async def get_whisper_status():
    from ai_engine.core.registry import ModelRegistry
    models = ModelRegistry.get_catalog_by_provider("whisper")
    model_ids = [m["id"] for m in models]
    primary = model_ids[0] if model_ids else "whisper-1"
    return {
        "success": True,
        "provider": "whisper",
        "available": WHISPER_AVAILABLE,
        "configured": WHISPER_AVAILABLE,
        "primary_model": primary,
        "supported_models": model_ids,
        "models": models,
    }


@router.post("/transcribe", summary="Transcribe speech audio via Whisper")
async def whisper_transcribe(body: TranscribeRequest):
    if not WHISPER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="openai-whisper package is not installed. Install with: pip install openai-whisper"
        )

    if not os.path.exists(body.audio_path):
        raise HTTPException(status_code=404, detail=f"Audio file not found: {body.audio_path}")

    try:
        engine = get_whisper_engine(model_name=body.model_name or "base")
        result = await engine.transcribe(
            audio_path=body.audio_path,
            language=body.language,
            task=body.task or "transcribe",
            verbose=body.verbose or False,
        )
        return {
            "success": True,
            "provider": "whisper",
            "text": result.text,
            "language": result.language,
            "duration": result.duration,
            "segments": [s.to_dict() for s in result.segments],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Whisper API Transcribe] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/subtitles", summary="Generate SRT or WebVTT subtitle files from audio")
async def whisper_subtitles(body: WhisperSubtitlesRequest):
    if not WHISPER_AVAILABLE:
        raise HTTPException(status_code=503, detail="openai-whisper is not available.")

    if not os.path.exists(body.audio_path):
        raise HTTPException(status_code=404, detail=f"Audio file not found: {body.audio_path}")

    try:
        engine = get_whisper_engine(model_name=body.model_name or "base")
        result = await engine.transcribe(
            audio_path=body.audio_path,
            language=body.language,
        )
        fmt = (body.format or "srt").lower()
        if fmt == "vtt":
            content = segments_to_vtt(result.segments)
        else:
            content = segments_to_srt(result.segments)

        return {
            "success": True,
            "provider": "whisper",
            "format": fmt,
            "subtitles": content,
            "segment_count": len(result.segments),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[Whisper API Subtitles] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
