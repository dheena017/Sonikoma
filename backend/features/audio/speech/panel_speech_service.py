"""
backend/features/audio/speech/panel_speech_service.py
─────────────────────────────────────────────────────────────────────────────
Speech synthesis engine for single panels: generates voice audio using
Microsoft Edge-TTS with exponential backoff retry, rate/pitch adaptation,
and duration fitting.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import base64
import asyncio
import tempfile
import logging
from typing import List, Optional, Tuple, Dict, Any

import edge_tts
from edge_tts.exceptions import NoAudioReceived
from pydub import AudioSegment
from pydub.effects import speedup

from features.audio.utils.clean_text import clean_comic_text
from features.audio.utils.audio_files import cache_audio, save_audio
from features.audio.speech.voice_preview_service import _set_speed_and_pitch

logger = logging.getLogger("sonikoma.audio.speech.panel")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

async def _try_speaking_with_retry(
    text: str,
    voice: str,
    temp_path: str,
    speed: Optional[str] = None,
    pitch: Optional[str] = None,
    max_tries: int = 3,
    base_delay: float = 1.0
) -> bool:
    """Attempts Edge-TTS synthesis with exponential backoff on transient network drops."""
    for attempt in range(1, max_tries + 1):
        try:
            kwargs = {}
            if speed:
                kwargs["rate"] = speed
            if pitch:
                kwargs["pitch"] = pitch
            comm = edge_tts.Communicate(text, voice, **kwargs)
            await comm.save(temp_path)
            if os.path.exists(temp_path) and os.path.getsize(temp_path) > 0:
                return True
        except (NoAudioReceived, Exception) as exc:
            logger.warning(f"[Speech] Attempt {attempt}/{max_tries} failed for '{text[:30]}': {exc}")

        if attempt < max_tries:
            await asyncio.sleep(base_delay * (2 ** (attempt - 1)))

    logger.error(f"[Speech] All {max_tries} attempts failed for '{text[:40]}'")
    return False


def _fit_sound_to_time(
    sound: AudioSegment,
    target_ms: int,
    force_time: bool = False
) -> AudioSegment:
    """Pads or speeds up an audio segment to match the storyboard timeline duration."""
    current_ms = len(sound)
    if current_ms <= 0:
        return AudioSegment.silent(duration=target_ms)

    if force_time:
        if current_ms < target_ms:
            # Pad with subtle silence at the end
            silence_padding = AudioSegment.silent(duration=target_ms - current_ms)
            return sound + silence_padding
        elif current_ms > target_ms:
            speed_factor = current_ms / target_ms
            if 1.0 < speed_factor <= 1.4:
                try:
                    return speedup(sound, playback_speed=speed_factor)
                except Exception:
                    pass
            return sound[:target_ms]

    return sound


def _save_and_pack_sound(
    sound: AudioSegment,
    output_path: Optional[str],
    as_base64: bool
) -> Tuple[Optional[str], Optional[str], float]:
    """Exports audio segment to disk and encodes base64 data."""
    duration_s = round(len(sound) / 1000.0, 2)
    buf = io.BytesIO()
    sound.export(buf, format="mp3")
    audio_bytes = buf.getvalue()

    b64_str = base64.b64encode(audio_bytes).decode("utf-8") if as_base64 else None

    saved_path = None
    if output_path:
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(audio_bytes)
        saved_path = output_path
    else:
        saved_path = save_audio(audio_bytes, f"panel_speech_{os.urandom(4).hex()}", "mp3")

    return saved_path, b64_str, duration_s


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def make_panel_speech(
    dialogue_list: List[str],
    target_duration: float = 4.0,
    voice: str = "en-US-GuyNeural",
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    output_path: Optional[str] = None,
    force_duration: bool = False,
    return_base64: bool = True
) -> Dict[str, Any]:
    """
    Makes spoken voice audio for one panel with optional length fitting.
    """
    # 1. Clean dialogue strings
    cleaned_dialogues = [clean_comic_text(d) for d in dialogue_list if clean_comic_text(d)]

    target_duration_ms = int(target_duration * 1000)

    # 2. Empty speech fallback
    if not cleaned_dialogues:
        silence_segment = AudioSegment.silent(duration=target_duration_ms)
        path, b64, dur = _save_and_pack_sound(silence_segment, output_path, return_base64)
        return {
            "success": True,
            "duration": dur,
            "audio_url": cache_audio(b64) if b64 else path,
            "audio_path": path,
            "audio_base64": b64,
            "is_silent": True,
        }

    # 3. Synthesize speech segments
    speed_param, pitch_param = _set_speed_and_pitch(speech_rate, speech_pitch)
    temp_dir = tempfile.gettempdir()
    temp_files = []
    stitched = AudioSegment.empty()

    try:
        for idx, text in enumerate(cleaned_dialogues):
            temp_file = os.path.join(temp_dir, f"seg_{os.urandom(4).hex()}_{idx}.mp3")
            temp_files.append(temp_file)

            ok = await _try_speaking_with_retry(
                text=text,
                voice=voice,
                temp_path=temp_file,
                speed=speed_param,
                pitch=pitch_param
            )

            if ok and os.path.exists(temp_file):
                seg = AudioSegment.from_file(temp_file)
                stitched += seg + AudioSegment.silent(duration=250)  # natural pause between lines
            else:
                logger.warning(f"Could not synthesize dialogue: '{text[:25]}'")

        # 4. Fit duration
        final_segment = _fit_sound_to_time(stitched, target_duration_ms, force_duration)

        # 5. Export
        path, b64, dur = _save_and_pack_sound(final_segment, output_path, return_base64)
        cached_url = cache_audio(b64) if b64 else path

        return {
            "success": True,
            "duration": dur,
            "audio_url": cached_url,
            "audio_path": path,
            "audio_base64": b64,
            "voice": voice,
            "is_silent": False,
        }
    finally:
        for tf in temp_files:
            if os.path.exists(tf):
                try:
                    os.remove(tf)
                except OSError:
                    pass


__all__ = ["make_panel_speech"]
