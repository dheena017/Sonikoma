"""
backend/python/routes/audio.py
─────────────────────────────────────────────────────────────────────────────
TTS audio synthesis endpoint.

POST /api/py/audio/generate
  Body: AudioGenerateRequest
  Returns: JSON with base64-encoded MP3 audio data
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import asyncio
import base64
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

# Ensure the parent package (backend/python) is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from media.audio.audio import generate_panel_audio
from media.audio.dialogue_aligner import align_dialogue_and_extract_peaks
import utils.image_utils as img_utils

logger = logging.getLogger("sonikoma.routes.audio")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────
class AlignDialogueRequest(BaseModel):
    audio_url: str = Field(..., description="URL of the audio file to analyze")
    ocr_texts: List[str] = Field(..., description="Array of OCR text strings detected in the panel")

class AudioGenerateRequest(BaseModel):
    dialogue_list: List[str] = Field(
        default_factory=list,
        description="Ordered list of dialogue strings to synthesize"
    )
    target_duration: float = Field(
        default=4.5, ge=0.1, le=600.0,
        description="Target duration of output audio in seconds"
    )
    voice: Optional[str] = Field(
        default="en-US-GuyNeural",
        description="Edge-TTS voice code (e.g. 'en-US-GuyNeural', 'en-GB-SoniaNeural')"
    )
    return_base64: bool = Field(
        default=True,
        description="If true, returns audio as base64 string; if false, saves to a temp file and returns its path"
    )


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/align-dialogue/{panel_id}", summary="Align OCR text to Whisper transcript and extract audio peaks")
async def align_dialogue(panel_id: str, body: AlignDialogueRequest):
    logger.info(f"[Dialogue Alignment] Request received for panel {panel_id}")
    try:
        # Resolve audio URL to a local temp file
        resolved = await img_utils.resolve_url_to_buffer(body.audio_url)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
            tmp_in.write(resolved["data"])
            tmp_audio_path = tmp_in.name

        try:
            result = await align_dialogue_and_extract_peaks(
                audio_path=tmp_audio_path,
                ocr_texts=body.ocr_texts
            )
            return {
                "success": True,
                "panel_id": panel_id,
                **result
            }
        finally:
            try:
                if os.path.exists(tmp_audio_path):
                    os.remove(tmp_audio_path)
            except OSError:
                pass

    except Exception as e:
        logger.error(f"[Dialogue Alignment API Error] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dialogue alignment failed: {e}")

@router.post("/generate", summary="Generate TTS panel audio")
async def generate_audio(body: AudioGenerateRequest):
    """
    Synthesizes dialogue text using Microsoft Edge TTS, concatenates segments,
    and applies time-stretching or silence-padding to match `target_duration`.

    Returns the audio as a base64-encoded MP3 string (default) or as a
    file path if `return_base64` is False.
    """
    # Create a temp output path
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        output_path = tmp.name

    try:
        logger.info(
            f"[Narration/TTS] Generating audio: {len(body.dialogue_list)} segments, "
            f"target={body.target_duration}s, voice={body.voice}"
        )

        saved_path, actual_dur = await generate_panel_audio(
            dialogue_list=body.dialogue_list,
            target_duration=body.target_duration,
            output_path=output_path,
            voice=body.voice,
        )

        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
            raise HTTPException(status_code=500, detail="Audio generation produced empty file.")

        if body.return_base64:
            with open(saved_path, "rb") as f:
                audio_bytes = f.read()
            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            file_size_kb = round(len(audio_bytes) / 1024, 1)
            logger.info(f"[Narration/TTS] Audio generated successfully ({file_size_kb}KB)")

            return JSONResponse(content={
                "success": True,
                "audio_base64": audio_b64,
                "mime_type": "audio/mpeg",
                "duration_target_s": body.target_duration,
                "duration_actual_s": actual_dur,
                "file_size_kb": file_size_kb,
                "voice": body.voice,
                "segments": len(body.dialogue_list),
            })
        else:
            return JSONResponse(content={
                "success": True,
                "audio_path": saved_path,
                "duration_actual_s": actual_dur,
                "voice": body.voice,
                "segments": len(body.dialogue_list),
            })

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Audio generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
    finally:
        # Clean up temp file only if we already read it into base64
        if body.return_base64 and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except OSError:
                pass


@router.get("/voices", summary="List available Edge-TTS voices (subset)")
async def list_voices():
    """Returns a curated list of supported Edge-TTS voices."""
    return JSONResponse(content={
        "success": True,
        "voices": [
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
        ],
    })
