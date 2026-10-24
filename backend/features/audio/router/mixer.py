"""
backend/features/audio/router/mixer.py
─────────────────────────────────────────────────────────────────────────────
Audio mixing endpoints:
POST /mix-audio-tracks – Mix voiceover, background music, and sound effects with ducking
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.audio.schemas import AudioMixRequest
from features.audio.mixer.track_mixer_service import mix_sound_tracks

logger = logging.getLogger("sonikoma.api.audio.mixer")
router = APIRouter()


@router.post("/mix-audio-tracks", summary="Mix voiceover and background music with auto-ducking")
async def mix_audio_endpoint(body: AudioMixRequest):
    """
    Blends voice narration and background music into a single master audio track.
    Supports volume control, automatic BGM ducking during dialogue, and BGM looping.
    """
    try:
        return await mix_sound_tracks(
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
        logger.error(f"[Mixer API] Mixing failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
