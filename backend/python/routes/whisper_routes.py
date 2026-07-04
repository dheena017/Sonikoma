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
from services.whisper_engine import get_whisper_engine, WhisperModel, WHISPER_AVAILABLE

logger = logging.getLogger("sonikoma.routes.whisper_routes")
router = APIRouter()


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


class TranscribeRequest(BaseModel):
    audio_path: str
    language: Optional[str] = None
    task: Optional[str] = Field("transcribe", description="Either 'transcribe' or 'translate'")
    verbose: Optional[bool] = False
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class SubtitleRequest(BaseModel):
    audio_path: str
    output_path: Optional[str] = None
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class ExtractWordsRequest(BaseModel):
    audio_path: str
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


class BatchTranscribeRequest(BaseModel):
    audio_paths: List[str]
    language: Optional[str] = None
    model_name: Optional[WhisperModel] = WhisperModel.BASE


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
