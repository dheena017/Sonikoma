"""
backend/features/video_editor/audio/services/mixer.py
─────────────────────────────────────────────────────────────────────────────
Multi-track audio mixing service.
Handles volume balancing, BGM looping, auto-ducking, and format conversion.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import math
import base64
import tempfile
import logging
from typing import Dict, Any, Optional
from pydub import AudioSegment

logger = logging.getLogger("sonikoma.video_editor.audio.services.mixer")


async def mix_audio_tracks_service(
    voice_audio_path: Optional[str] = None,
    voice_audio_base64: Optional[str] = None,
    bgm_audio_url: Optional[str] = None,
    voice_volume: float = 1.0,
    bgm_volume: float = 0.3,
    auto_ducking: bool = True,
    ducking_factor: float = 0.25,
    target_duration: Optional[float] = None,
    output_format: str = "mp3",
    return_base64: bool = False,
) -> Dict[str, Any]:
    """
    Blends a voice narration track and optional background music (BGM) into a
    single master audio file with volume control, ducking, and looping.
    """
    # ── Resolve voice track ───────────────────────────────────────────────
    if voice_audio_base64:
        voice_bytes = base64.b64decode(voice_audio_base64.split(",")[-1])
        voice_segment = AudioSegment.from_file(io.BytesIO(voice_bytes))
    elif voice_audio_path and os.path.exists(voice_audio_path):
        voice_segment = AudioSegment.from_file(voice_audio_path)
    else:
        voice_segment = AudioSegment.silent(duration=int((target_duration or 4.0) * 1000))

    # ── Apply voice volume ────────────────────────────────────────────────
    if voice_volume != 1.0 and voice_volume > 0:
        db_gain = 20 * math.log10(voice_volume)
        voice_segment = voice_segment + db_gain

    # ── Resolve BGM track ─────────────────────────────────────────────────
    bgm_segment = None
    if bgm_audio_url:
        bgm_path = bgm_audio_url
        if bgm_path.startswith("http"):
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.get(bgm_path)
                if r.status_code == 200:
                    bgm_segment = AudioSegment.from_file(io.BytesIO(r.content))
        elif os.path.exists(bgm_path):
            bgm_segment = AudioSegment.from_file(bgm_path)

    # ── Mix tracks ────────────────────────────────────────────────────────
    if bgm_segment:
        desired_len = int((target_duration * 1000) if target_duration else len(voice_segment))

        # Loop BGM if shorter than desired length
        if 0 < len(bgm_segment) < desired_len:
            loops_needed = int(desired_len / len(bgm_segment)) + 1
            bgm_segment = bgm_segment * loops_needed
        bgm_segment = bgm_segment[:desired_len]

        # Apply BGM volume with optional ducking
        effective_bgm_vol = bgm_volume * (ducking_factor if auto_ducking else 1.0)
        if effective_bgm_vol > 0:
            bgm_gain = 20 * math.log10(max(0.001, effective_bgm_vol))
            bgm_segment = bgm_segment + bgm_gain
        else:
            bgm_segment = bgm_segment - 60  # essentially mute

        mixed = bgm_segment.overlay(voice_segment, position=0)
    else:
        mixed = voice_segment

    # ── Export ────────────────────────────────────────────────────────────
    out_fmt = output_format.lower() if output_format in ("mp3", "wav") else "mp3"
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
        "audio_base64": base64.b64encode(out_bytes).decode("utf-8") if return_base64 else None,
    }


__all__ = ["mix_audio_tracks_service"]
