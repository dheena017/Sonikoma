"""
backend/features/audio/subtitles/srt_subtitles_service.py
─────────────────────────────────────────────────────────────────────────────
SubRip (.srt) subtitle generator: writes standard sequential movie subtitles
with HH:MM:SS,mmm timestamp codes.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from typing import Optional, Union
from ai_engine.providers.whisper import WhisperModel, format_srt_time
from features.audio.subtitles.speech_to_text_service import _start_speech_model

logger = logging.getLogger("sonikoma.audio.subtitles.srt")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _write_srt_time(seconds: float) -> str:
    """Formats floating-point seconds into SubRip subtitle timestamp (HH:MM:SS,mmm)."""
    return format_srt_time(seconds)


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def make_srt_subtitles(
    audio_path: str,
    output_path: Optional[str] = None,
    model_name: Union[WhisperModel, str] = WhisperModel.BASE,
    language: Optional[str] = None
) -> str:
    """
    Creates a standard movie .srt subtitle file from spoken audio.
    """
    engine = _start_speech_model(model_name=model_name, device="cpu")
    result = await engine.transcribe(audio_path, language=language)

    srt_lines = []
    for segment in result.segments:
        start_t = _write_srt_time(segment.start_time)
        end_t = _write_srt_time(segment.end_time)

        srt_lines.append(f"{segment.id + 1}")
        srt_lines.append(f"{start_t} --> {end_t}")
        srt_lines.append(segment.text.strip())
        srt_lines.append("")

    srt_content = "\n".join(srt_lines)

    dest_file = output_path or os.path.join(tempfile.gettempdir(), f"subs_{os.urandom(4).hex()}.srt")
    os.makedirs(os.path.dirname(os.path.abspath(dest_file)), exist_ok=True)
    with open(dest_file, "w", encoding="utf-8") as f:
        f.write(srt_content)

    logger.info(f"✓ Saved SRT subtitles: {dest_file}")
    return dest_file


__all__ = ["make_srt_subtitles"]
