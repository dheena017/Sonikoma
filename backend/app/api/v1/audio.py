
# ─────────────────────────────────────────────────────────────────────────────
# FROM audio.py
# ─────────────────────────────────────────────────────────────────────────────
from api.dependencies.auth import get_current_user, get_admin_user, oauth2_scheme
from schemas.audio import *
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
audio_router = APIRouter()
router = audio_router


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────



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
            f"target={body.target_duration}s, voice={body.voice}, rate={body.speech_rate}, pitch={body.speech_pitch}"
        )

        saved_path, actual_dur = await generate_panel_audio(
            dialogue_list=body.dialogue_list,
            target_duration=body.target_duration,
            output_path=output_path,
            voice=body.voice,
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
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


# ─────────────────────────────────────────────────────────────────────────────
# FROM librosa_routes.py
# ─────────────────────────────────────────────────────────────────────────────
from api.dependencies.auth import get_current_user, get_admin_user, oauth2_scheme
from schemas.audio import *
"""
backend/python/routes/librosa_routes.py
─────────────────────────────────────────────────────────────────────────────
Audio analysis routes powered by Librosa.
"""

import os
import sys
import tempfile
import logging
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from media.audio.librosa_engine import get_librosa_engine

logger = logging.getLogger("sonikoma.routes.librosa_routes")
librosa_router = APIRouter()
router = librosa_router

try:
    librosa_engine = get_librosa_engine()
except ImportError as exc:
    logger.warning(f"Librosa routes disabled: {exc}")
    librosa_engine = None


def _ensure_librosa_engine() -> Any:
    if librosa_engine is None:
        raise HTTPException(
            status_code=503,
            detail="Librosa is not installed. Install with: pip install librosa soundfile"
        )
    return librosa_engine




class AudioAnalyzeRequest(AudioPathRequest):
    pass


class SilenceDetectRequest(AudioPathRequest):
    threshold_db: Optional[float] = Field(-40.0, description="Silence threshold in dB")
    min_duration: Optional[float] = Field(0.5, description="Minimum silence duration in seconds")


class EnergySegmentRequest(AudioPathRequest):
    num_segments: Optional[int] = Field(10, description="Maximum number of energy segments")
    energy_threshold: Optional[float] = None


@router.post("/analyze", summary="Extract audio summary statistics")
async def analyze_audio(body: AudioAnalyzeRequest):
    try:
        engine = _ensure_librosa_engine()
        stats = await engine.extract_summary_stats(body.audio_path)
        return {"success": True, "analysis": stats}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Audio analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-silence", summary="Detect silence segments in audio")
async def detect_silence(body: SilenceDetectRequest):
    try:
        engine = _ensure_librosa_engine()
        segments = await engine.detect_silence(body.audio_path, threshold_db=body.threshold_db, min_duration=body.min_duration)
        return {"success": True, "silence_segments": [s.__dict__ for s in segments]}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Silence detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/segment-by-energy", summary="Segment audio by energy levels")
async def segment_by_energy(body: EnergySegmentRequest):
    try:
        engine = _ensure_librosa_engine()
        segments = await engine.segment_by_energy(body.audio_path, num_segments=body.num_segments, energy_threshold=body.energy_threshold)
        return {"success": True, "segments": [s.__dict__ for s in segments]}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Energy segmentation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/load", summary="Load audio metadata and shape")
async def load_audio(body: AudioPathRequest):
    try:
        engine = _ensure_librosa_engine()
        y, sr = await engine.load_audio(body.audio_path)
        return {"success": True, "duration_seconds": len(y) / sr, "sample_rate": sr, "samples": len(y)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Load audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ─────────────────────────────────────────────────────────────────────────────
# FROM whisper_routes.py
# ─────────────────────────────────────────────────────────────────────────────
from api.dependencies.auth import get_current_user, get_admin_user, oauth2_scheme
from schemas.audio import *
"""
backend/python/routes/whisper_routes.py
─────────────────────────────────────────────────────────────────────────────
Speech-to-text routes powered by Whisper.
"""

import os
import sys
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from media.audio.whisper_engine import get_whisper_engine, WhisperModel, WHISPER_AVAILABLE

logger = logging.getLogger("sonikoma.routes.whisper_routes")
whisper_router = APIRouter()
router = whisper_router


def _ensure_whisper_engine(model_name: WhisperModel, device: str = "cpu"):
    if not WHISPER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Whisper is not installed or not available. Install with: pip install openai-whisper"
        )
    try:
        return get_whisper_engine(model_name=model_name, device=device)
    except ImportError as exc:
        raise HTTPException(status_code=503, detail=str(exc))










def _get_engine(model_name: WhisperModel, device: str = "cpu"):
    if model_name != WhisperModel.BASE:
        return get_whisper_engine(model_name=model_name, device=device)
    return get_whisper_engine(device=device)


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"whisper_{os.urandom(4).hex()}{suffix}")


@router.post("/transcribe", summary="Transcribe audio to text")
async def transcribe(body: TranscribeRequest):
    try:
        engine = _ensure_whisper_engine(body.model_name, device="cpu")
        result = await engine.transcribe(body.audio_path, language=body.language, task=body.task, verbose=body.verbose)
        return {
            "success": True,
            "text": result.text,
            "language": result.language,
            "duration": result.duration,
            "confidence": result.confidence,
            "segments": [s.__dict__ for s in result.segments],
        }
    except Exception as exc:
        logger.error(f"Transcription failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-srt", summary="Generate SRT subtitle file")
async def generate_srt(body: SubtitleRequest):
    output_path = body.output_path or _default_output_path(".srt")
    try:
        engine = _ensure_whisper_engine(body.model_name, device="cpu")
        result_path = await engine.generate_srt(body.audio_path, output_path, language=body.language)
        return {"success": True, "srt_path": result_path}
    except Exception as exc:
        logger.error(f"Generate SRT failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-vtt", summary="Generate WebVTT subtitle file")
async def generate_vtt(body: SubtitleRequest):
    output_path = body.output_path or _default_output_path(".vtt")
    try:
        engine = _ensure_whisper_engine(body.model_name, device="cpu")
        result_path = await engine.generate_vtt(body.audio_path, output_path, language=body.language)
        return {"success": True, "vtt_path": result_path}
    except Exception as exc:
        logger.error(f"Generate VTT failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-words", summary="Extract word-level timestamps from audio")
async def extract_words(body: ExtractWordsRequest):
    try:
        engine = _ensure_whisper_engine(body.model_name, device="cpu")
        words = await engine.extract_words_with_timestamps(body.audio_path, language=body.language)
        return {"success": True, "words": words}
    except Exception as exc:
        logger.error(f"Extract words failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-transcribe", summary="Transcribe multiple audio files")
async def batch_transcribe(body: BatchTranscribeRequest):
    try:
        engine = _ensure_whisper_engine(body.model_name, device="cpu")
        results = await engine.batch_transcribe(body.audio_paths, language=body.language)
        return {"success": True, "results": [r.__dict__ if r else None for r in results]}
    except Exception as exc:
        logger.error(f"Batch transcribe failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

