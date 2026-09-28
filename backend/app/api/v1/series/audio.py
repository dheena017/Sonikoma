"""Audio Dub Stage sub-router for AI Generated Series.

Handles vocal dubbing synthesis using Microsoft Edge-TTS, multi-character voice profiles,
per-bubble audio generation, and full chapter batch dubbing.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.repositories.series import ai_series_repo
from app.services.series.series_audio_service import series_audio_service, VOICE_LIST
from app.schemas.series import ChapterSession

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


@router.post("/{series_id}/dubbing/synthesize", response_model=DubbingTrack)
async def synthesize_voice_track(series_id: str, req: SynthesizeVoiceRequest):
    """Generate real vocal audio performance for a dialogue line using Edge-TTS."""
    project = ai_series_repo.get_project(series_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

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
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio synthesis failed: {str(e)}")


@router.get("/{series_id}/dubbing/available-voices")
async def list_available_voices():
    """List recommended free Edge-TTS neural voices for anime, comic, and manhwa dubbing."""
    return VOICE_LIST
