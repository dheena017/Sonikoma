"""
AI Vision & Panel Analysis API Router.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from features.ai.schemas import ReadPanelRequest, ReadPanelResponse
from features.ai.analysis import (
    read_panel,
    read_many_panels,
    cut_out_panels,
    find_emotion,
    find_sound_effects,
)

router = APIRouter(prefix="/analysis", tags=["AI Vision Analysis"])


@router.post("/read-panel", response_model=Dict[str, Any])
async def endpoint_read_panel(req: ReadPanelRequest) -> Dict[str, Any]:
    """Reads a comic panel picture and extracts characters, dialogue, emotion, and motion cues."""
    try:
        return await read_panel(
            picture=req.picture_url,
            story_notes=req.story_notes,
            past_events=req.past_events,
            ai_provider=req.ai_provider,
            model_name=req.model_name
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emotion")
def endpoint_find_emotion(line: str, look: str = "") -> Dict[str, Any]:
    """Detects emotion and speaking cadence from dialogue line."""
    return find_emotion(speech_line=line, face_look=look or None)


@router.get("/sound-effects")
def endpoint_find_sfx(word: str, genre: str = "action") -> Dict[str, Any]:
    """Matches comic sound effect word to audio effect categories."""
    return find_sound_effects(sound_word=word, genre=genre)


__all__ = ["router"]
