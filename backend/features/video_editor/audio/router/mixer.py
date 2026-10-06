"""
backend/features/video_editor/audio/router/mixer.py
─────────────────────────────────────────────────────────────────────────────
Multi-track audio mixing — voice narration + BGM with auto-ducking.
POST /mix-audio-tracks    – Mix voiceover + background music tracks
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.video_editor.audio.schemas import AudioMixRequest
from features.video_editor.audio.services.mixer import mix_audio_tracks_service

logger = logging.getLogger("sonikoma.api.audio.mixer")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/mix-audio-tracks", summary="Mix voiceover, background music, and audio tracks with auto-ducking")
async def mix_audio_endpoint(body: AudioMixRequest):
    """
    Blends a voice narration track and optional background music (BGM) into a
    single master audio file. Supports:
      - Volume control per track
      - Automatic BGM ducking during dialogue (configurable factor)
      - BGM looping to match voice/chapter duration
      - Output as mp3 or wav, with optional base64 payload
    """
    try:
        return await mix_audio_tracks_service(
            voice_audio_path=body.voice_audio_path,
            voice_audio_base64=body.voice_audio_base64,
            bgm_audio_url=body.bgm_audio_url,
            voice_volume=body.voice_volume,
            bgm_volume=body.bgm_volume,
            auto_ducking=body.auto_ducking,
            ducking_factor=body.ducking_factor,
            target_duration=body.target_duration,
            output_format=body.output_format,
            return_base64=body.return_base64,
        )
    except Exception as exc:
        logger.error(f"[AudioMixer] Mixing failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router", "mix_audio_endpoint"]
