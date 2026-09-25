"""
backend/app/api/v1/audio/tts.py
─────────────────────────────────────────────────────────────────────────────
Text-To-Speech synthesis and voice listing endpoints.
POST /synthesize-panel-audio – Generate TTS audio for one panel
POST /synthesize-all-panel-audio – Generate TTS audio for all panels
GET  /list-tts-voices – List all available Edge-TTS voices
POST /preview-tts-voice – Instant voice audition / preview
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import base64
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

try:
    from core.cache import stitched_cache
except ImportError:
    from app.core.cache import stitched_cache

from schemas.audio import AudioGenerateRequest, AudioPreviewRequest, BatchAudioGenerateRequest, BatchPanelAudioItem
from services.audio import generate_tts_audio, get_available_voices

logger = logging.getLogger("sonikoma.api.audio.tts")
router = APIRouter()


def _cache_audio_base64(b64_str: str) -> Optional[str]:
    """Caches base64-encoded audio to stitched_cache for instant URL playback."""
    try:
        raw_bytes = base64.b64decode(b64_str)
        cache_id = f"audio_{uuid.uuid4().hex[:12]}"
        stitched_cache.set(cache_id, {"data": raw_bytes, "content_type": "audio/mpeg"})
        return f"/api/v1/images/cached/{cache_id}"
    except Exception as exc:
        logger.warning(f"[_cache_audio_base64] Failed to cache audio: {exc}")
        return f"data:audio/mpeg;base64,{b64_str}"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/synthesize-panel-audio", summary="Synthesize TTS audio for one storyboard panel")
async def generate_tts_endpoint(body: AudioGenerateRequest):
    """Synthesizes speech from a list of dialogue strings or text using Edge-TTS."""
    try:
        dialogues = body.dialogue_list
        if not dialogues:
            fallback_text = body.text or body.script or body.prompt or ""
            if fallback_text.strip():
                dialogues = [fallback_text.strip()]

        result = await generate_tts_audio(
            dialogue_list=dialogues,
            target_duration=body.target_duration,
            voice=body.voice,
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=body.return_base64
        )
        if result.get("audio_base64"):
            result["audio_url"] = _cache_audio_base64(result["audio_base64"])
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"[TTS] Audio generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/synthesize-all-panel-audio", summary="Synthesize TTS audio for all storyboard panels")
async def batch_generate_tts_endpoint(body: BatchAudioGenerateRequest):
    """
    Synthesizes TTS audio for multiple storyboard panels concurrently.
    Decoupled from image vision analysis so users can review text first,
    or generate audio independently.
    """
    if not body.panels:
        return JSONResponse(content={"success": True, "results": []})

    async def _process_panel(panel: BatchPanelAudioItem) -> dict:
        panel_res = {
            "id": panel.id,
            "success": True,
            "audio_url": None,
            "narrative_audio_url": None,
            "duration": None,
        }
        target_voice = panel.voice or body.voice or "en-US-GuyNeural"
        dur = panel.target_duration or 4.0

        # 1. Dialogue TTS
        if body.generate_dialogue_audio:
            dialogues = panel.dialogue_list
            if not dialogues and panel.text and panel.text.strip():
                dialogues = [panel.text.strip()]

            if dialogues:
                try:
                    res_diag = await generate_tts_audio(
                        dialogue_list=dialogues,
                        target_duration=dur,
                        voice=target_voice,
                        speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
                        speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
                        return_base64=True,
                    )
                    if res_diag.get("audio_base64"):
                        panel_res["audio_url"] = _cache_audio_base64(res_diag["audio_base64"])
                    if res_diag.get("duration_actual_s"):
                        panel_res["duration"] = res_diag["duration_actual_s"]
                except Exception as exc:
                    logger.warning(f"[Batch TTS] Dialogue audio failed for panel {panel.id}: {exc}")

        # 2. Narrative TTS
        if body.generate_narrative_audio and panel.narrative and panel.narrative.strip():
            try:
                narr_text = panel.narrative.strip()
                if len(narr_text) > 500:
                    narr_text = narr_text[:500]
                res_narr = await generate_tts_audio(
                    dialogue_list=[narr_text],
                    target_duration=dur,
                    voice=target_voice,
                    speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
                    speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
                    return_base64=True,
                )
                if res_narr.get("audio_base64"):
                    panel_res["narrative_audio_url"] = _cache_audio_base64(res_narr["audio_base64"])
                if res_narr.get("duration_actual_s") and not panel_res["audio_url"]:
                    panel_res["duration"] = res_narr["duration_actual_s"]
            except Exception as exc:
                logger.warning(f"[Batch TTS] Narrative audio failed for panel {panel.id}: {exc}")

        return panel_res

    # Concurrency limit to avoid overwhelming TTS engine
    semaphore = asyncio.Semaphore(4)

    async def _sem_process(p):
        async with semaphore:
            return await _process_panel(p)

    results = await asyncio.gather(*(_sem_process(p) for p in body.panels))
    return JSONResponse(content={"success": True, "results": list(results)})


@router.get("/list-tts-voices", summary="List available Edge-TTS voices")
async def list_voices_endpoint():
    """Returns all available Microsoft Edge-TTS neural voice codes and display names."""
    voices = get_available_voices()
    return JSONResponse(content={"success": True, "voices": voices})


@router.post("/preview-tts-voice", summary="Generate instant spoken audio preview with selected voice and pitch")
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
