"""
backend/features/audio/mixer/track_mixer_service.py
─────────────────────────────────────────────────────────────────────────────
Multi-track audio mixer: blends voiceover, background music (BGM), and sound
effects with ducking, volume control, and loop matching.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import math
import base64
import logging
from typing import Dict, Any, Optional, Literal
from pydub import AudioSegment

from features.audio.utils.audio_files import download_audio, save_audio, cache_audio
from features.audio.mixer.auto_ducking_service import lower_music_when_speaking
from features.audio.mixer.music_loop_service import loop_music
from features.audio.mixer.volume_normalizer_service import balance_volume

logger = logging.getLogger("sonikoma.audio.mixer.tracks")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

async def _open_sound_track(
    file_path: Optional[str],
    base64_str: Optional[str],
    default_duration: float
) -> AudioSegment:
    """Loads an audio track from file path, URL, or base64 string into an AudioSegment."""
    if base64_str:
        raw_b64 = base64_str.split(",")[-1]
        decoded = base64.b64decode(raw_b64)
        return AudioSegment.from_file(io.BytesIO(decoded))

    if file_path:
        resolved = await download_audio(file_path)
        return AudioSegment.from_file(io.BytesIO(resolved["data"]))

    return AudioSegment.silent(duration=int(default_duration * 1000))


def _place_track_at_second(
    master: AudioSegment,
    new_track: AudioSegment,
    time_ms: int = 0
) -> AudioSegment:
    """Overlays an audio track onto the master canvas at a specific millisecond offset."""
    return master.overlay(new_track, position=time_ms)


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def mix_sound_tracks(
    voice_audio_path: Optional[str] = None,
    voice_audio_base64: Optional[str] = None,
    bgm_audio_url: Optional[str] = None,
    voice_volume: float = 1.0,
    bgm_volume: float = 0.35,
    auto_ducking: bool = True,
    ducking_factor: float = 0.25,
    target_duration: Optional[float] = None,
    output_format: Literal["mp3", "wav"] = "mp3",
    return_base64: bool = False
) -> Dict[str, Any]:
    """
    Combines character voices, background music, and sound effects into one finished audio track.
    """
    fallback_dur = target_duration or 4.0

    # 1. Load Voice Track
    voice_track = await _open_sound_track(voice_audio_path, voice_audio_base64, fallback_dur)
    if voice_volume != 1.0 and voice_volume > 0:
        gain_db = 20.0 * math.log10(voice_volume)
        voice_track = voice_track.apply_gain(gain_db)

    # 2. Determine target scene length
    target_len_ms = int(target_duration * 1000) if target_duration else len(voice_track)
    if target_len_ms <= 0:
        target_len_ms = 4000

    # 3. Load & Process BGM Track
    if bgm_audio_url:
        bgm_track = await _open_sound_track(bgm_audio_url, None, fallback_dur)
        # Loop music to fit target length
        bgm_track = loop_music(bgm_track, target_len_ms)

        # Apply base BGM volume
        if bgm_volume > 0:
            bgm_gain = 20.0 * math.log10(bgm_volume)
            bgm_track = bgm_track.apply_gain(bgm_gain)

        # Apply auto-ducking during dialogue
        if auto_ducking and len(voice_track) > 0:
            bgm_track = lower_music_when_speaking(bgm_track, voice_track, ducking_factor)

        # Overlay voice onto music
        mixed = _place_track_at_second(bgm_track, voice_track, time_ms=0)
    else:
        mixed = voice_track

    # 4. Normalize final output
    master = balance_volume(mixed)

    # 5. Export
    fmt = output_format.lower() if output_format in ("mp3", "wav") else "mp3"
    out_buf = io.BytesIO()
    master.export(out_buf, format=fmt)
    mixed_bytes = out_buf.getvalue()

    saved_path = save_audio(mixed_bytes, f"mixed_{os.urandom(4).hex()}", fmt)
    b64_str = base64.b64encode(mixed_bytes).decode("utf-8") if return_base64 else None
    cached_url = cache_audio(b64_str) if b64_str else saved_path

    return {
        "success": True,
        "duration": round(len(master) / 1000.0, 2),
        "format": fmt,
        "audio_path": saved_path,
        "audio_url": cached_url,
        "audio_base64": b64_str,
    }


__all__ = ["mix_sound_tracks"]
