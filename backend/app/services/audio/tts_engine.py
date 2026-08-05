"""
backend/app/services/audio/tts_engine.py
─────────────────────────────────────────────────────────────────────────────
Text-to-Speech synthesis engine using Microsoft Edge-TTS with sample rate
normalization, speed/pitch adjustment, and multi-speaker alignment.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import io
import base64
import logging
import tempfile
import asyncio
from typing import List, Optional, Tuple, Dict, Any, cast

import edge_tts
from edge_tts.exceptions import NoAudioReceived
from pydub import AudioSegment
from pydub.effects import speedup

logger = logging.getLogger("sonikoma.services.audio.tts_engine")

VOICE_MAP = {
    "Standard Comic Narrator (Male)": "en-US-GuyNeural",
    "Sultry Narrative Tone (Female)": "en-US-JennyNeural",
    "Shonen Protagonist (Energetic Male)": "en-US-JasonNeural",
    "Dark Anti-Hero voice (Raspy Deep)": "en-US-TonyNeural",
    
    "English (US) — Guy (Male)": "en-US-GuyNeural",
    "English (US) — Jenny (Female)": "en-US-JennyNeural",
    "English (US) — Aria (Female)": "en-US-AriaNeural",
    "English (UK) — Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) — Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) — Natasha (Female)": "en-AU-NatashaNeural",
    "Korean — SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean — InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese — Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese (Mandarin) — Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) — Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) — Valluvar (Male)": "ta-IN-ValluvarNeural",

    "English (US) - Guy (Male)": "en-US-GuyNeural",
    "English (US) - Jenny (Female)": "en-US-JennyNeural",
    "English (US) - Aria (Female)": "en-US-AriaNeural",
    "English (UK) - Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) - Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) - Natasha (Female)": "en-AU-NatashaNeural",
    "Korean - SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean - InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese - Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese (Mandarin) - Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) - Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) - Valluvar (Male)": "ta-IN-ValluvarNeural"
}

_TTS_MIN_ALPHA_CHARS = 3

def sanitize_text_for_tts(text: str) -> str:
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text


async def generate_segment_with_retry(
    text: str,
    voice: str,
    temp_file_path: str,
    rate: Optional[str] = None,
    pitch: Optional[str] = None,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> bool:
    for attempt in range(1, max_retries + 1):
        try:
            communicate_kwargs = {}
            if rate is not None:
                communicate_kwargs["rate"] = rate
            if pitch is not None:
                communicate_kwargs["pitch"] = pitch
            communicate = edge_tts.Communicate(text, voice, **communicate_kwargs)
            await communicate.save(temp_file_path)
            if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                return True
            logger.warning(f"[Narration/TTS] Attempt {attempt}: saved file is empty for text: '{text[:40]}'")
        except NoAudioReceived as e:
            logger.warning(f"[Narration/TTS] Attempt {attempt}/{max_retries}: NoAudioReceived for text: '{text[:40]}'. Error: {e}")
        except Exception as e:
            logger.warning(f"[Narration/TTS] Attempt {attempt}/{max_retries}: Error for text: '{text[:40]}'. Error: {e}")

        if attempt < max_retries:
            delay = base_delay * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    logger.error(f"[Narration/TTS] All {max_retries} attempts failed for text: '{text[:40]}'.")
    return False


async def generate_panel_audio(
    dialogue_list: List[Any],
    target_duration: float,
    output_path: str,
    voice: Optional[str] = "en-US-GuyNeural",
    force_duration: bool = False,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
) -> Tuple[str, float]:
    parsed_dialogues: List[str] = []
    for item in dialogue_list:
        if isinstance(item, dict):
            parsed_dialogues.append(str(item.get("text", "")))
        else:
            parsed_dialogues.append(str(item))

    if not parsed_dialogues or all(not text.strip() for text in parsed_dialogues):
        logger.warning(f"Empty dialogue list encountered for output: {output_path}. Defaulting to silence.")
        silence_segment = AudioSegment.silent(duration=int(target_duration * 1000))
        if os.path.dirname(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
        silence_segment.export(output_path, format="mp3")
        return output_path, target_duration

    target_duration_ms = int(target_duration * 1000)
    temp_dir = tempfile.gettempdir()
    temp_files = []

    actual_voice = VOICE_MAP.get(voice, voice) if voice else "en-US-GuyNeural"
    if not actual_voice or "-" not in actual_voice or actual_voice.strip().lower() in ("undefined", "null", "default"):
        actual_voice = "en-US-GuyNeural"

    rate_percent = int((speech_rate - 1.0) * 100)
    rate_str = f"{rate_percent:+}%"
    pitch_hz = int((speech_pitch - 1.0) * 50)
    pitch_str = f"{pitch_hz:+}Hz"

    try:
        for idx, text in enumerate(parsed_dialogues):
            if not text.strip():
                continue

            text = sanitize_text_for_tts(text)
            temp_file_path = os.path.join(temp_dir, f"dialog_segment_{os.urandom(4).hex()}_{idx}.mp3")
            temp_files.append(temp_file_path)

            if not any(c.isalnum() for c in text):
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            alpha_count = sum(1 for c in text if c.isalpha())
            if alpha_count < _TTS_MIN_ALPHA_CHARS:
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            success = await generate_segment_with_retry(text, actual_voice, temp_file_path, rate=rate_str, pitch=pitch_str)
            if not success:
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")

        def process_audio_sync():
            combined_audio = AudioSegment.empty()
            for idx, file_path in enumerate(temp_files):
                if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                    continue

                segment = AudioSegment.from_file(file_path, format="mp3")
                normalized_seg = segment.set_frame_rate(44100).set_channels(2)

                combined_audio += normalized_seg
                if idx < len(temp_files) - 1:
                    combined_audio += AudioSegment.silent(duration=100)

            current_duration_ms = len(combined_audio)

            if current_duration_ms == 0:
                final_audio = AudioSegment.silent(duration=target_duration_ms)
            elif force_duration:
                if current_duration_ms > target_duration_ms and target_duration_ms > 0:
                    playback_speed = float(current_duration_ms) / float(target_duration_ms)
                    if playback_speed > 1.0:
                        try:
                            final_audio = cast(AudioSegment, speedup(combined_audio, playback_speed=playback_speed))
                        except Exception:
                            final_audio = combined_audio
                    else:
                        final_audio = combined_audio
                    final_audio = final_audio[:target_duration_ms]
                else:
                    silence_needed_ms = target_duration_ms - current_duration_ms
                    silence_padding = AudioSegment.silent(duration=silence_needed_ms)
                    final_audio = combined_audio + silence_padding
                    final_audio = final_audio[:target_duration_ms]
            else:
                final_audio = combined_audio

            final_duration_ms = len(final_audio)

            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            final_audio.export(output_path, format="mp3")
            return final_duration_ms / 1000.0

        actual_duration = await asyncio.to_thread(process_audio_sync)
        return output_path, actual_duration

    except Exception as general_err:
        logger.error(f"Audio Engine pipeline failure: {str(general_err)}", exc_info=True)
        try:
            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            fallback_silence = AudioSegment.silent(duration=target_duration_ms)
            fallback_silence.export(output_path, format="mp3")
            return output_path, target_duration
        except Exception as write_fallback_err:
            raise general_err
    finally:
        for f in temp_files:
            try:
                if os.path.exists(f):
                    os.remove(f)
            except Exception:
                pass


async def generate_tts_audio(
    dialogue_list: List[Dict[str, Any]],
    target_duration: float,
    voice: str,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    return_base64: bool = True
) -> Dict[str, Any]:
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        output_path = tmp.name

    try:
        saved_path, actual_dur = await generate_panel_audio(
            dialogue_list=dialogue_list,
            target_duration=target_duration,
            output_path=output_path,
            voice=voice,
            speech_rate=speech_rate,
            speech_pitch=speech_pitch
        )

        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
            raise ValueError("Audio generation produced empty file.")

        if return_base64:
            with open(saved_path, "rb") as f:
                audio_bytes = f.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            file_size_kb = round(len(audio_bytes) / 1024, 1)

            return {
                "success": True,
                "audio_base64": audio_b64,
                "mime_type": "audio/mpeg",
                "duration_target_s": target_duration,
                "duration_actual_s": actual_dur,
                "file_size_kb": file_size_kb,
                "voice": voice,
                "segments": len(dialogue_list),
            }
        else:
            return {
                "success": True,
                "audio_path": saved_path,
                "duration_actual_s": actual_dur,
                "voice": voice,
                "segments": len(dialogue_list),
            }
    finally:
        if return_base64 and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass


def get_available_voices() -> List[Dict[str, str]]:
    return [
        {"code": "en-US-GuyNeural",       "label": "English (US) — Guy (Male)"},
        {"code": "en-US-JennyNeural",      "label": "English (US) — Jenny (Female)"},
        {"code": "en-US-AriaNeural",       "label": "English (US) — Aria (Female)"},
        {"code": "en-GB-SoniaNeural",      "label": "English (UK) — Sonia (Female)"},
        {"code": "en-GB-RyanNeural",       "label": "English (UK) — Ryan (Male)"},
        {"code": "en-AU-NatashaNeural",    "label": "English (AU) — Natasha (Female)"},
        {"code": "ko-KR-SunHiNeural",      "label": "Korean — SunHi (Female)"},
        {"code": "ko-KR-InJoonNeural",     "label": "Korean — InJoon (Male)"},
        {"code": "ja-JP-NanamiNeural",     "label": "Japanese — Nanami (Female)"},
        {"code": "zh-CN-XiaoxiaoNeural",   "label": "Chinese (Mandarin) — Xiaoxiao (Female)"},
        {"code": "ta-IN-PallaviNeural",    "label": "Tamil (India) — Pallavi (Female)"},
        {"code": "ta-IN-ValluvarNeural",   "label": "Tamil (India) — Valluvar (Male)"},
    ]


# Human-readable aliases
synthesize_panel_narration_audio = generate_panel_audio
synthesize_dialogue_to_speech = generate_tts_audio
get_supported_voice_list = get_available_voices

