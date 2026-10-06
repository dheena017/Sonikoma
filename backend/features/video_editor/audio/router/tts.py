"""
backend/features/video_editor/audio/router/tts.py
─────────────────────────────────────────────────────────────────────────────
Text-To-Speech synthesis and voice listing endpoints.
POST /synthesize-panel-audio     – Generate TTS audio for one panel
POST /synthesize-all-panel-audio – Generate TTS audio for all panels (batch)
GET  /list-tts-voices            – List all available Edge-TTS voices
POST /preview-tts-voice          – Instant voice audition / preview
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from features.video_editor.audio.schemas import (
    AudioGenerateRequest,
    AudioPreviewRequest,
    BatchAudioGenerateRequest,
)
from features.video_editor.audio.services import (
    generate_tts_audio,
    get_available_voices,
    cache_audio_base64,
    batch_synthesize_panels_service,
)

logger = logging.getLogger("sonikoma.api.audio.tts")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/synthesize-panel-audio", summary="Synthesize TTS audio for one storyboard panel")
async def generate_tts_endpoint(body: AudioGenerateRequest):
    """Synthesizes speech from a list of dialogue strings or text using Edge-TTS."""
    try:
        dialogues = body.dialogue_list or []
        if not dialogues:
            fallback_text = body.text or body.script or body.prompt or ""
            if fallback_text.strip():
                dialogues = [fallback_text.strip()]

        result = await generate_tts_audio(
            dialogue_list=dialogues,
            target_duration=body.target_duration or 4.0,
            voice=body.voice or "en-US-GuyNeural",
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=bool(body.return_base64),
        )
        if result.get("audio_base64"):
            result["audio_url"] = cache_audio_base64(result["audio_base64"])
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"[TTS] Audio generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/synthesize-all-panel-audio", summary="Synthesize TTS audio for all storyboard panels")
async def batch_generate_tts_endpoint(body: BatchAudioGenerateRequest):
    """
    Concurrently synthesizes TTS audio for all storyboard panels.
    Decoupled from image vision so users can review text first,
    or generate audio independently.
    """
    if not body.panels:
        return JSONResponse(content={"success": True, "results": []})

    start_time = time.monotonic()
    total_panels = len(body.panels)
    logger.info(
        f"[Audio Engine] >>> POST /synthesize-all-panel-audio started for {total_panels} panel(s) | "
        f"Voice: '{body.voice}' | Rate: {body.speech_rate}x | Pitch: {body.speech_pitch}x | "
        f"Dialogue: {body.generate_dialogue_audio} | Narrative: {body.generate_narrative_audio}"
    )

    results = await batch_synthesize_panels_service(
        panels=body.panels,
        voice=body.voice or "en-US-GuyNeural",
        speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
        speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
        generate_dialogue_audio=body.generate_dialogue_audio,
        generate_narrative_audio=body.generate_narrative_audio,
        force_regenerate=bool(body.force_regenerate),
        concurrency=4,
    )

    elapsed = time.monotonic() - start_time
    success_count = sum(1 for r in results if r.get("audio_url") or r.get("narrative_audio_url"))
    logger.info(
        f"[Audio Engine] <<< Completed /synthesize-all-panel-audio: "
        f"{success_count}/{total_panels} panels ready in {elapsed:.2f}s"
    )
    return JSONResponse(content={"success": True, "results": results})


@router.get("/list-tts-voices", summary="List available Edge-TTS voices")
async def list_voices_endpoint():
    """Returns all available Microsoft Edge-TTS neural voice codes and display names."""
    voices = get_available_voices()
    return JSONResponse(content={"success": True, "voices": voices})


@router.post("/preview-tts-voice", summary="Generate instant spoken audio preview with selected voice and pitch")
async def preview_voice_endpoint(body: AudioPreviewRequest):
    """Quick audio audition endpoint to test and preview Edge-TTS voice delivery."""
    try:
        sample_text = body.text.strip() if body.text and body.text.strip() else \
            "Welcome to Sonikoma. Turning comic panels into cinematic stories."
        voice = body.voice or "en-US-GuyNeural"
        speech_rate = body.speech_rate if body.speech_rate is not None else 1.0
        speech_pitch = body.speech_pitch if body.speech_pitch is not None else 1.0

        res = await generate_tts_audio(
            dialogue_list=[sample_text],
            target_duration=3.0,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch,
            return_base64=True,
        )
        return {
            "success": True,
            "voice": voice,
            "text": sample_text,
            "duration": res.get("duration_actual_s", res.get("duration", 2.5)),
            "audio_base64": res.get("audio_base64"),
            "format": "mp3",
            "provider": body.provider or "edge-tts",
        }
    except Exception as exc:
        logger.error(f"[TTS] Preview generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = [
    "router",
    "generate_tts_endpoint",
    "batch_generate_tts_endpoint",
    "list_voices_endpoint",
    "preview_voice_endpoint",
]
