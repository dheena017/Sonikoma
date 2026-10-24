"""
backend/features/audio/router/speech.py
─────────────────────────────────────────────────────────────────────────────
Speech synthesis endpoints:
POST /synthesize-panel-audio     – Synthesize voice audio for one panel
POST /synthesize-all-panel-audio – Synthesize voice audio for all panels (batch)
GET  /list-tts-voices            – List supported neural voices
POST /preview-tts-voice          – Instant voice audition preview
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from features.audio.schemas import (
    AudioGenerateRequest,
    AudioPreviewRequest,
    BatchAudioGenerateRequest,
)
from features.audio.speech import (
    make_panel_speech,
    make_all_panel_speech,
    preview_voice,
    list_all_voices,
)

logger = logging.getLogger("sonikoma.api.audio.speech")
router = APIRouter()


@router.post("/synthesize-panel-audio", summary="Synthesize speech audio for one panel")
async def generate_speech_endpoint(body: AudioGenerateRequest):
    """Generates voice audio for a single panel using Edge-TTS."""
    try:
        dialogues = body.dialogue_list or []
        if not dialogues:
            fallback = body.text or body.script or body.prompt or ""
            if fallback.strip():
                dialogues = [fallback.strip()]

        result = await make_panel_speech(
            dialogue_list=dialogues,
            target_duration=body.target_duration or 4.0,
            voice=body.voice or "en-US-GuyNeural",
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=bool(body.return_base64),
        )
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"[Speech API] Voice synthesis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/synthesize-all-panel-audio", summary="Batch synthesize speech for all panels")
async def batch_generate_speech_endpoint(body: BatchAudioGenerateRequest):
    """Generates dialogue and narration speech audio for multiple panels concurrently."""
    try:
        updated_panels = await make_all_panel_speech(
            panels=body.panels,
            voice=body.voice or "en-US-GuyNeural",
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            generate_dialogue=bool(body.generate_dialogue_audio),
            generate_narrative=bool(body.generate_narrative_audio),
            force_regenerate=bool(body.force_regenerate),
        )
        return JSONResponse(content={"success": True, "panels": updated_panels})
    except Exception as exc:
        logger.error(f"[Speech API] Batch synthesis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/list-tts-voices", summary="List supported Edge-TTS neural voices")
async def list_voices_endpoint(language: Optional[str] = None, gender: Optional[str] = None):
    """Returns all available Edge-TTS neural voices across languages and styles."""
    voices = list_all_voices(language=language, gender=gender)
    return JSONResponse(content={"success": True, "voices": voices, "total": len(voices)})


@router.post("/preview-tts-voice", summary="Audition a voice with sample text")
async def preview_voice_endpoint(body: AudioPreviewRequest):
    """Generates an instant 2-second audio preview of a voice."""
    try:
        result = await preview_voice(
            text=body.text,
            voice=body.voice or "en-US-GuyNeural",
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=bool(body.return_base64),
        )
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"[Speech API] Preview failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
