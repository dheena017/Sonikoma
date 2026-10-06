"""
backend/app/api/v1/providers/edge_tts.py
─────────────────────────────────────────────────────────────────────────────
Microsoft Edge Neural TTS Provider API Routes:
- GET  /status     – Availability of edge-tts runtime
- GET  /voices     – Full catalog of neural voices (languages, accents, genders)
- POST /synthesize – High-speed speech synthesis returning cached audio URL / base64
- POST /preview    – Instant audio preview snippet for character audition
─────────────────────────────────────────────────────────────────────────────
"""

import base64
import uuid
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.cache import stitched_cache
from ai_engine.providers.edge_tts import (
    EdgeTTSProvider,
    EdgeTTSClient,
    EDGE_TTS_AVAILABLE,
    DEFAULT_VOICES,
    VOICE_LIST,
)

logger = logging.getLogger("sonikoma.api.providers.edge_tts")
router = APIRouter()


class EdgeTTSSynthesizeRequest(BaseModel):
    text: str
    voice: Optional[str] = "en-US-GuyNeural"
    rate: Optional[str] = "+0%"
    pitch: Optional[str] = "+0Hz"


class EdgeTTSPreviewRequest(BaseModel):
    voice: str = "en-US-GuyNeural"
    text: Optional[str] = "Hello! This is a test of Sonikoma neural speech dubbing."


@router.get("/status", summary="Check Edge-TTS provider availability")
async def get_edge_tts_status():
    return {
        "success": True,
        "provider": "edge_tts",
        "available": EDGE_TTS_AVAILABLE,
        "configured": EDGE_TTS_AVAILABLE,
        "default_voice": "en-US-GuyNeural",
        "total_curated_voices": len(VOICE_LIST),
    }


@router.get("/voices", summary="List all supported Microsoft Edge Neural voices")
async def get_edge_tts_voices(
    language: Optional[str] = Query(None, description="Filter by language code (e.g., 'en', 'ja', 'ko')"),
    gender: Optional[str] = Query(None, description="Filter by gender ('Male', 'Female')")
):
    voices = EdgeTTSClient.get_voice_list()
    if language:
        lang_lower = language.lower()
        voices = [v for v in voices if lang_lower in v.get("Locale", "").lower() or lang_lower in v.get("ShortName", "").lower()]
    if gender:
        gender_lower = gender.lower()
        voices = [v for v in voices if v.get("Gender", "").lower() == gender_lower]

    return {
        "success": True,
        "provider": "edge_tts",
        "count": len(voices),
        "voices": voices,
    }


@router.post("/synthesize", summary="Synthesize speech audio from text using Edge-TTS")
async def edge_tts_synthesize(body: EdgeTTSSynthesizeRequest):
    if not EDGE_TTS_AVAILABLE:
        raise HTTPException(status_code=503, detail="edge-tts Python package is not available.")

    clean_text = EdgeTTSClient.sanitize_text(body.text)
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text field cannot be empty.")

    try:
        audio_bytes = await EdgeTTSClient.synthesize(
            text=clean_text,
            voice=body.voice or "en-US-GuyNeural",
            rate=body.rate or "+0%",
            pitch=body.pitch or "+0Hz",
        )
        if not audio_bytes:
            raise HTTPException(status_code=502, detail="Edge-TTS synthesis produced empty audio data.")

        # Cache in memory cache for instant streaming
        cache_id = f"tts_{uuid.uuid4().hex[:12]}.mp3"
        stitched_cache.set(cache_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
        audio_url = f"/api/v1/images/cached/{cache_id}"

        b64_str = base64.b64encode(audio_bytes).decode("ascii")

        return {
            "success": True,
            "provider": "edge_tts",
            "voice": body.voice,
            "url": audio_url,
            "audio_url": audio_url,
            "audio_base64": f"data:audio/mpeg;base64,{b64_str}",
            "bytes_length": len(audio_bytes),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[EdgeTTS API Synthesize] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/preview", summary="Generate a quick voice preview audition")
async def edge_tts_preview(body: EdgeTTSPreviewRequest):
    sample_text = body.text or "This is a preview sample of character voice narration."
    try:
        audio_bytes = await EdgeTTSClient.synthesize(
            text=sample_text,
            voice=body.voice,
        )
        if not audio_bytes:
            raise HTTPException(status_code=502, detail="Failed to synthesize preview audio.")

        cache_id = f"prev_{uuid.uuid4().hex[:12]}.mp3"
        stitched_cache.set(cache_id, {"data": audio_bytes, "content_type": "audio/mpeg"})
        return {
            "success": True,
            "voice": body.voice,
            "preview_url": f"/api/v1/images/cached/{cache_id}",
        }
    except Exception as exc:
        logger.error(f"[EdgeTTS API Preview] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
