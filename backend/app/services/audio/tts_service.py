"""
backend/app/services/audio/tts_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for TTS synthesis using Microsoft Edge-TTS, concatenation, and
stretching/padding/alignment orchestration.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import base64
import tempfile
import logging
from typing import List, Dict, Any

from backend.media.audio.audio import generate_panel_audio

logger = logging.getLogger("sonikoma.services.audio.tts_service")


async def generate_tts_audio(
    dialogue_list: List[Dict[str, Any]],
    target_duration: float,
    voice: str,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
    return_base64: bool = True
) -> Dict[str, Any]:
    """
    Synthesizes dialogue text segments, concatenates, aligns, stretches/pads to target duration.
    """
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        output_path = tmp.name

    try:
        logger.info(
            f"[TTS Service] Synthesizing: {len(dialogue_list)} segments, target={target_duration}s, voice={voice}"
        )
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
    """Returns a curated list of supported Edge-TTS voices."""
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
