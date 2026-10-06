"""
backend/app/api/v1/providers/elevenlabs.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ElevenLabs Neural Voice AI Provider API Routes:
- GET  /status     â€“ Availability & API key configuration state
- GET  /voices     â€“ Pre-configured and custom character voice catalog
- POST /synthesize â€“ Studio-grade neural voice synthesis
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import base64
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.dependencies.auth import get_all_user_keys, clean_api_key
from app.core.cache import stitched_cache
from ai_engine.providers.elevenlabs import (
    ElevenLabsClient,
    ElevenLabsProvider,
    DEFAULT_ELEVENLABS_VOICES,
    VoiceSettings,
)

logger = logging.getLogger("sonikoma.api.providers.elevenlabs")
router = APIRouter()


class ElevenLabsSynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "21m00Tcm4TlvDq8ikWAM"  # Rachel default
    model_id: Optional[str] = "eleven_multilingual_v2"
    stability: Optional[float] = 0.5
    similarity_boost: Optional[float] = 0.75
    api_key: Optional[str] = None


@router.get("/status", summary="Check ElevenLabs provider status and configuration")
async def get_elevenlabs_status(user_keys: dict = Depends(get_all_user_keys)):
    user_key = clean_api_key(user_keys.get("elevenlabs")) or ElevenLabsClient.get_api_key()
    return {
        "success": True,
        "provider": "elevenlabs",
        "available": True,
        "configured": bool(user_key),
        "primary_model": "eleven_multilingual_v2",
        "default_voice": "21m00Tcm4TlvDq8ikWAM",
    }


@router.get("/voices", summary="List curated ElevenLabs studio character voices")
async def get_elevenlabs_voices():
    voice_list = [
        {"name": name, "voice_id": vid, "provider": "elevenlabs"}
        for name, vid in DEFAULT_ELEVENLABS_VOICES.items()
    ]
    return {
        "success": True,
        "provider": "elevenlabs",
        "count": len(voice_list),
        "voices": voice_list,
    }


@router.post("/synthesize", summary="Synthesize speech audio via ElevenLabs API")
async def elevenlabs_synthesize(
    body: ElevenLabsSynthesizeRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    key = clean_api_key(body.api_key) or user_keys.get("elevenlabs") or ElevenLabsClient.get_api_key()
    if not key:
        raise HTTPException(status_code=400, detail="ElevenLabs API key is required.")

    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")

    settings = VoiceSettings(
        stability=body.stability or 0.5,
        similarity_boost=body.similarity_boost or 0.75,
    )

    try:
        audio_bytes = await ElevenLabsClient.synthesize_speech(
            text=body.text,
            voice_id=body.voice_id or "21m00Tcm4TlvDq8ikWAM",
            model_id=body.model_id or "eleven_multilingual_v2",
            settings=settings,
            api_key=key,
        )

        if not audio_bytes:
            raise HTTPException(status_code=502, detail="ElevenLabs speech synthesis returned empty audio data.")

        # Cache in memory cache
        cache_id = f"el_{uuid.uuid4().hex[:12]}.mp3"
        stitched_cache.set(cache_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
        audio_url = f"/api/v1/images/cached/{cache_id}"

        b64_str = base64.b64encode(audio_bytes).decode("ascii")

        return {
            "success": True,
            "provider": "elevenlabs",
            "voice_id": body.voice_id,
            "model_id": body.model_id,
            "url": audio_url,
            "audio_url": audio_url,
            "audio_base64": f"data:audio/mpeg;base64,{b64_str}",
            "bytes_length": len(audio_bytes),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[ElevenLabs API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

