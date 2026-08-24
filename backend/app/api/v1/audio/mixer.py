"""
backend/app/api/v1/audio/mixer.py
─────────────────────────────────────────────────────────────────────────────
Multi-track audio mixing — voice narration + BGM with auto-ducking.
POST /mix            – Mix voiceover + background music tracks
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import math
import base64
import tempfile
import logging

from fastapi import APIRouter, HTTPException
from pydub import AudioSegment

from schemas.audio import AudioMixRequest

logger = logging.getLogger("sonikoma.api.audio.mixer")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/mix", summary="Mix voiceover, background music, and audio tracks with auto-ducking")
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
        # ── Resolve voice track ───────────────────────────────────────────────
        if body.voice_audio_base64:
            voice_bytes = base64.b64decode(body.voice_audio_base64.split(",")[-1])
            voice_segment = AudioSegment.from_file(io.BytesIO(voice_bytes))
        elif body.voice_audio_path and os.path.exists(body.voice_audio_path):
            voice_segment = AudioSegment.from_file(body.voice_audio_path)
        else:
            voice_segment = AudioSegment.silent(duration=int((body.target_duration or 4.0) * 1000))

        # ── Apply voice volume ────────────────────────────────────────────────
        if body.voice_volume != 1.0 and body.voice_volume > 0:
            db_gain = 20 * math.log10(body.voice_volume)
            voice_segment = voice_segment + db_gain

        # ── Resolve BGM track ─────────────────────────────────────────────────
        bgm_segment = None
        if body.bgm_audio_url:
            bgm_path = body.bgm_audio_url
            if bgm_path.startswith("http"):
                import requests
                r = requests.get(bgm_path, timeout=10)
                if r.status_code == 200:
                    bgm_segment = AudioSegment.from_file(io.BytesIO(r.content))
            elif os.path.exists(bgm_path):
                bgm_segment = AudioSegment.from_file(bgm_path)

        # ── Mix tracks ────────────────────────────────────────────────────────
        if bgm_segment:
            desired_len = int((body.target_duration * 1000) if body.target_duration else len(voice_segment))

            # Loop BGM if shorter than desired length
            if 0 < len(bgm_segment) < desired_len:
                loops_needed = int(desired_len / len(bgm_segment)) + 1
                bgm_segment = bgm_segment * loops_needed
            bgm_segment = bgm_segment[:desired_len]

            # Apply BGM volume with optional ducking
            effective_bgm_vol = body.bgm_volume * (body.ducking_factor if body.auto_ducking else 1.0)
            if effective_bgm_vol > 0:
                bgm_gain = 20 * math.log10(max(0.001, effective_bgm_vol))
                bgm_segment = bgm_segment + bgm_gain
            else:
                bgm_segment = bgm_segment - 60  # essentially mute

            mixed = bgm_segment.overlay(voice_segment, position=0)
        else:
            mixed = voice_segment

        # ── Export ────────────────────────────────────────────────────────────
        out_fmt = body.output_format.lower() if body.output_format in ("mp3", "wav") else "mp3"
        out_io = io.BytesIO()
        mixed.export(out_io, format=out_fmt)
        out_bytes = out_io.getvalue()

        temp_out = os.path.join(tempfile.gettempdir(), f"mixed_audio_{os.urandom(4).hex()}.{out_fmt}")
        with open(temp_out, "wb") as f:
            f.write(out_bytes)

        return {
            "success": True,
            "duration": round(len(mixed) / 1000.0, 2),
            "format": out_fmt,
            "file_path": temp_out,
            "audio_base64": base64.b64encode(out_bytes).decode("utf-8") if body.return_base64 else None
        }

    except Exception as exc:
        logger.error(f"[AudioMixer] Mixing failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
