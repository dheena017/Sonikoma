"""
backend/features/audio/speech/voice_preview_service.py
─────────────────────────────────────────────────────────────────────────────
Voice audition: generates a quick audio sample for testing voice models
and controls in the user interface.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import base64
import tempfile
import logging
from typing import Dict, Any, Optional, Tuple

import edge_tts
from features.audio.utils.clean_text import clean_comic_text
from features.audio.utils.audio_files import cache_audio

logger = logging.getLogger("sonikoma.audio.speech.preview")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _set_speed_and_pitch(
    speed: float,
    pitch: float
) -> Tuple[Optional[str], Optional[str]]:
    """Converts numeric speed and pitch multipliers into Edge-TTS percentage strings."""
    rate_str = None
    pitch_str = None

    if speed is not None and abs(speed - 1.0) > 0.01:
        pct = int(round((speed - 1.0) * 100))
        rate_str = f"+{pct}%" if pct >= 0 else f"{pct}%"

    if pitch is not None and abs(pitch - 1.0) > 0.01:
        pct = int(round((pitch - 1.0) * 100))
        pitch_str = f"+{pct}Hz" if pct >= 0 else f"{pct}Hz"

    return rate_str, pitch_str


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def preview_voice(
    text: str = "Welcome to Sonikoma. Turning comic panels into cinematic stories.",
    voice: str = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    return_base64: bool = True
) -> Dict[str, Any]:
    """
    Plays a quick audio sample of any chosen voice for auditioning in UI.
    """
    clean = clean_comic_text(text) or "Welcome to Sonikoma."
    rate_param, pitch_param = _set_speed_and_pitch(speech_rate, speech_pitch)

    kwargs = {}
    if rate_param:
        kwargs["rate"] = rate_param
    if pitch_param:
        kwargs["pitch"] = pitch_param

    temp_path = os.path.join(tempfile.gettempdir(), f"preview_{os.urandom(4).hex()}.mp3")
    try:
        communicate = edge_tts.Communicate(clean, voice, **kwargs)
        await communicate.save(temp_path)

        with open(temp_path, "rb") as f:
            audio_bytes = f.read()

        b64_str = base64.b64encode(audio_bytes).decode("utf-8")
        cached_url = cache_audio(b64_str)

        return {
            "success": True,
            "voice": voice,
            "text": clean,
            "audio_url": cached_url,
            "audio_base64": b64_str if return_base64 else None,
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


__all__ = ["preview_voice"]
