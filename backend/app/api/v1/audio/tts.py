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

import time
import os
import asyncio
import base64
import logging
import uuid
from typing import Optional, Dict, Any, List

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
            dialogue_list=dialogues or [],
            target_duration=body.target_duration or 4.0,
            voice=body.voice or "en-US-GuyNeural",
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=bool(body.return_base64)
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

    start_time = time.monotonic()
    total_panels = len(body.panels)
    logger.info(
        f"[Audio Engine] >>> POST /api/v1/audio/synthesize-all-panel-audio started for {total_panels} panel(s) | "
        f"Voice: '{body.voice}' | Rate: {body.speech_rate}x | Pitch: {body.speech_pitch}x | "
        f"Dialogue: {body.generate_dialogue_audio} | Narrative: {body.generate_narrative_audio}"
    )

    async def _process_panel(panel: BatchPanelAudioItem, idx: int) -> dict:
        panel_res: Dict[str, Any] = {
            "id": panel.id,
            "success": True,
            "audio_url": None,
            "narrative_audio_url": None,
            "duration": None,
        }
        target_voice = panel.voice or body.voice or "en-US-GuyNeural"
        dur = panel.target_duration or 4.0
        p_idx = panel.panel_index or (idx + 1)
        img_name = os.path.basename(panel.image_url) if panel.image_url else f"panel_{panel.id}"
        panel_tag = f"Panel {p_idx}/{total_panels} (ID: {panel.id}, Image: {img_name})"

        # Check existing audio from request or disk cache
        if panel.audio_url and not body.force_regenerate:
            panel_res["audio_url"] = panel.audio_url
        if panel.narrative_audio_url and not body.force_regenerate:
            panel_res["narrative_audio_url"] = panel.narrative_audio_url

        if not panel_res["audio_url"] and not body.force_regenerate:
            cached = stitched_cache.get(f"audio_panel_{panel.id}")
            if cached and cached.get("data"):
                panel_res["audio_url"] = f"/api/v1/images/cached/audio_panel_{panel.id}"
                logger.info(f"[Audio Engine] {panel_tag}: Reusing existing cached audio -> Skipping synthesis.")

        # 1. Dialogue TTS
        dialogues = panel.dialogue_list
        if not dialogues and panel.text and panel.text.strip():
            dialogues = [panel.text.strip()]

        if body.generate_dialogue_audio and dialogues and not panel_res["audio_url"]:
            logger.info(f"[Audio Engine] Synthesizing Dialogue for {panel_tag} | Voice: '{target_voice}'")
            try:
                res_diag = await generate_tts_audio(
                    dialogue_list=dialogues,
                    target_duration=dur,
                    voice=target_voice,
                    speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
                    speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
                    return_base64=True,
                    context_info=f"{panel_tag} [Dialogue]",
                )
                if res_diag.get("audio_base64"):
                    b64 = res_diag["audio_base64"]
                    panel_res["audio_url"] = _cache_audio_base64(b64)
                    try:
                        raw_bytes = base64.b64decode(b64)
                        stitched_cache.set(f"audio_panel_{panel.id}", {"data": raw_bytes, "content_type": "audio/mpeg"})
                    except Exception:
                        pass
                if res_diag.get("duration_actual_s"):
                    panel_res["duration"] = res_diag["duration_actual_s"]
            except Exception as exc:
                logger.warning(f"[Audio Engine] {panel_tag} Dialogue audio failed: {exc}")

        # 2. Narrative TTS
        if body.generate_narrative_audio and panel.narrative and panel.narrative.strip() and not panel_res["narrative_audio_url"]:
            narr_text = panel.narrative.strip()
            diag_text = (dialogues[0].strip() if dialogues and len(dialogues) == 1 else (panel.text or "").strip())
            
            # Optimization: If narrative is identical to dialogue, reuse synthesized audio
            if narr_text and diag_text and narr_text == diag_text and panel_res.get("audio_url"):
                panel_res["narrative_audio_url"] = panel_res["audio_url"]
            else:
                if len(narr_text) > 500:
                    narr_text = narr_text[:500]
                logger.info(f"[Audio Engine] Synthesizing Narrative for {panel_tag} | Voice: '{target_voice}'")
                try:
                    res_narr = await generate_tts_audio(
                        dialogue_list=[narr_text],
                        target_duration=dur,
                        voice=target_voice,
                        speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
                        speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
                        return_base64=True,
                        context_info=f"{panel_tag} [Narrative]",
                    )
                    if res_narr.get("audio_base64"):
                        panel_res["narrative_audio_url"] = _cache_audio_base64(res_narr["audio_base64"])
                    if res_narr.get("duration_actual_s") and not panel_res["audio_url"]:
                        panel_res["duration"] = res_narr["duration_actual_s"]
                except Exception as exc:
                    logger.warning(f"[Audio Engine] {panel_tag} Narrative audio failed: {exc}")

        return panel_res

    # Concurrency limit tuned for Microsoft Edge WebSocket stability (4 concurrent streams)
    semaphore = asyncio.Semaphore(4)

    async def _sem_process(p, idx):
        async with semaphore:
            return await _process_panel(p, idx)

    results = await asyncio.gather(*(_sem_process(p, i) for i, p in enumerate(body.panels)))
    elapsed = time.monotonic() - start_time
    success_count = sum(1 for r in results if r.get("audio_url") or r.get("narrative_audio_url"))
    logger.info(
        f"[Audio Engine] <<< Completed POST /api/v1/audio/synthesize-all-panel-audio: "
        f"{success_count}/{total_panels} panels ready in {elapsed:.2f}s"
    )
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
