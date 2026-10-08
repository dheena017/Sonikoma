"""Audio Dub Stage sub-router for AI Generated Series.

Handles vocal dubbing synthesis using Microsoft Edge-TTS, multi-character voice profiles,
per-bubble audio generation, full chapter batch dubbing, and voice auditions.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from features.intelligence.series.repositories import ai_series_repo
from features.intelligence.series.services.series_audio_service import series_audio_service, VOICE_LIST
from features.intelligence.series.schemas import ChapterSession

logger = logging.getLogger("sonikoma.series.router.audio")

router = APIRouter(tags=["AI Series - Audio Dub Stage"])


class SynthesizeVoiceRequest(BaseModel):
    speaker_name: str
    voice_name: Optional[str] = None
    text: str
    pitch: str = "+0Hz"
    rate: str = "+0%"
    panel_id: Optional[str] = None


class DubbingTrack(BaseModel):
    track_id: str
    panel_id: Optional[str] = None
    speaker_name: str
    text: str
    audio_url: str
    duration_seconds: float
    voice_name: Optional[str] = None


class BatchSynthesizeAudioRequest(BaseModel):
    voice_override: Optional[str] = None
    force_regenerate: bool = False


class AuditionVoiceRequest(BaseModel):
    character_name: str
    gender: str = "male"
    role: str = "protagonist"
    sample_text: Optional[str] = None


@router.post("/{series_id}/dubbing/synthesize", response_model=DubbingTrack)
async def synthesize_voice_track(series_id: str, req: SynthesizeVoiceRequest):
    """Generate real vocal audio performance for a dialogue line using Edge-TTS."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        logger.error(f"[Audio] Series '{series_id}' not found.")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Series '{series_id}' not found.")

    try:
        res = await series_audio_service.synthesize_speech(
            series_id=series_id,
            text=req.text,
            speaker_name=req.speaker_name,
            voice_name=req.voice_name,
            pitch=req.pitch,
            rate=req.rate,
        )

        return DubbingTrack(
            track_id=res["track_id"],
            panel_id=req.panel_id or "panel_active",
            speaker_name=req.speaker_name,
            text=res["text"],
            audio_url=res["audio_url"],
            duration_seconds=res.get("duration_seconds", 2.0),
            voice_name=res.get("voice_name"),
        )
    except Exception as e:
        logger.exception(f"[Audio] Failed to synthesize speech for '{req.speaker_name}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vocal synthesis error: {str(e)}",
        )


@router.post("/{series_id}/chapters/{session_number}/{chapter_number}/synthesize-audio", response_model=ChapterSession)
async def synthesize_chapter_audio_endpoint(
    series_id: str,
    session_number: int,
    chapter_number: int,
    req: Optional[BatchSynthesizeAudioRequest] = None,
):
    """Synthesize vocal audio for all dialogue bubbles across the entire chapter in one click."""
    try:
        voice_override = req.voice_override if req else None
        chapter = await series_audio_service.synthesize_chapter_audio(
            series_id=series_id,
            session_number=session_number,
            chapter_number=chapter_number,
            voice_override=voice_override,
        )
        return chapter
    except ValueError as e:
        logger.error(f"[Audio] Chapter not found S{session_number}:C{chapter_number}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception(f"[Audio] Audio batch synthesis failed for S{session_number}:C{chapter_number}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Audio synthesis failed: {str(e)}")


@router.post("/{series_id}/chapters/{chapter_id}/dub-dialogue")
async def dub_chapter_by_id_endpoint(
    series_id: str,
    chapter_id: str,
    req: Optional[BatchSynthesizeAudioRequest] = None,
):
    """Execute batch Edge-TTS vocal dubbing for all dialogue bubbles in a chapter by ID."""
    try:
        force = req.force_regenerate if req else False
        res = await series_audio_service.dub_chapter_dialogue(
            series_id=series_id,
            chapter_id=chapter_id,
            force_regenerate=force,
        )
        return res
    except ValueError as e:
        logger.error(f"[Audio] Dubbing failed: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception(f"[Audio] Dubbing failed for chapter {chapter_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Dubbing failed: {str(e)}")


@router.post("/auditions/preview")
async def audition_voice_preview(req: AuditionVoiceRequest):
    """Generate on-the-fly vocal audition sample for Series Bible character creation UI."""
    try:
        res = await series_audio_service.audition_character_voice(
            character_name=req.character_name,
            gender=req.gender,
            role=req.role,
            sample_text=req.sample_text,
        )
        return res
    except Exception as e:
        logger.exception(f"[Audio] Vocal audition preview failed: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Voice preview failed: {str(e)}")


@router.get("/available-voices")
@router.get("/{series_id}/dubbing/available-voices")
async def list_available_voices(series_id: Optional[str] = None):
    """List recommended free Edge-TTS neural voices for anime, comic, and manhwa dubbing."""
    return VOICE_LIST
