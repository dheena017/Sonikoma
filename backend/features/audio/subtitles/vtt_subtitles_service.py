"""
backend/features/audio/subtitles/vtt_subtitles_service.py
─────────────────────────────────────────────────────────────────────────────
HTML5 WebVTT (.vtt) subtitle generator: creates web-compatible caption tracks
formatted for modern HTML5 video elements and mobile browsers.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from typing import Optional, Union
from ai_engine.providers.whisper import WhisperModel, format_vtt_time
from features.audio.subtitles.speech_to_text_service import _start_speech_model

logger = logging.getLogger("sonikoma.audio.subtitles.vtt")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _write_vtt_time(seconds: float) -> str:
    """Formats floating-point seconds into WebVTT timestamp (HH:MM:SS.mmm)."""
    return format_vtt_time(seconds)


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def make_vtt_subtitles(
    audio_path: str,
    output_path: Optional[str] = None,
    model_name: Union[WhisperModel, str] = WhisperModel.BASE,
    language: Optional[str] = None
) -> str:
    """
    Creates a web-ready .vtt subtitle file for web video players.
    """
    engine = _start_speech_model(model_name=model_name, device="cpu")
    result = await engine.transcribe(audio_path, language=language)

    vtt_lines = ["WEBVTT", ""]
    for segment in result.segments:
        start_t = _write_vtt_time(segment.start_time)
        end_t = _write_vtt_time(segment.end_time)

        vtt_lines.append(f"{start_t} --> {end_t}")
        vtt_lines.append(segment.text.strip())
        vtt_lines.append("")

    vtt_content = "\n".join(vtt_lines)

    dest_file = output_path or os.path.join(tempfile.gettempdir(), f"subs_{os.urandom(4).hex()}.vtt")
    os.makedirs(os.path.dirname(os.path.abspath(dest_file)), exist_ok=True)
    with open(dest_file, "w", encoding="utf-8") as f:
        f.write(vtt_content)

    logger.info(f"✓ Saved WebVTT subtitles: {dest_file}")
    return dest_file


__all__ = ["make_vtt_subtitles"]
