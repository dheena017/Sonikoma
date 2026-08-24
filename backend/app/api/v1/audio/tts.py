"""
backend/app/api/v1/audio/tts.py
─────────────────────────────────────────────────────────────────────────────
Text-To-Speech synthesis and voice listing endpoints.
POST /tts           – Generate TTS panel audio
GET  /voices        – List all available Edge-TTS voices
POST /preview       – Instant voice audition / preview
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from schemas.audio import AudioGenerateRequest, AudioPreviewRequest
from services.audio import generate_tts_audio, get_available_voices

logger = logging.getLogger("sonikoma.api.audio.tts")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/tts", summary="Generate TTS panel audio")
async def generate_tts_endpoint(body: AudioGenerateRequest):
    """Synthesizes speech from a list of dialogue strings using Edge-TTS."""
    try:
        result = await generate_tts_audio(
            dialogue_list=body.dialogue_list,
            target_duration=body.target_duration,
            voice=body.voice,
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=body.return_base64
        )
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"[TTS] Audio generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/voices", summary="List available Edge-TTS voices")
async def list_voices_endpoint():
    """Returns all available Microsoft Edge-TTS neural voice codes and display names."""
    voices = get_available_voices()
    return JSONResponse(content={"success": True, "voices": voices})


@router.post("/preview", summary="Generate instant spoken audio preview with selected voice and pitch")
async def preview_voice_endpoint(body: AudioPreviewRequest):
    """Quick audio audition endpoint to test and preview Edge-TTS voice delivery."""
    try:
        sample_text = body.text.strip() or "Welcome to Sonikoma. Turning comic panels into cinematic stories."
        voice = body.voice or "en-US-GuyNeural"
        speech_rate = body.speech_rate if body.speech_rate is not None else 1.0
        speech_pitch = body.speech_pitch if body.speech_pitch is not None else 1.0

        res = await generate_tts_audio(
            dialogue_list=[sample_text],
            target_duration=3.0,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            return_base64=True
        )

        return {
            "success": True,
            "voice": voice,
            "text": sample_text,
            "duration": res.get("duration", 2.5),
            "audio_base64": res.get("audio_base64"),
            "format": "mp3",
            "provider": body.provider or "edge-tts"
        }
    except Exception as exc:
        logger.error(f"[TTS] Preview generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
