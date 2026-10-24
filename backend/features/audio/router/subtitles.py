"""
backend/features/audio/router/subtitles.py
─────────────────────────────────────────────────────────────────────────────
Speech-to-text and subtitle generation endpoints:
POST /transcribe-audio          – Transcribe audio to text via Whisper
POST /transcribe-audio-batch    – Batch transcribe multiple audio files
POST /generate-srt-subtitles    – Export SRT subtitle file
POST /generate-vtt-subtitles    – Export WebVTT subtitle file
POST /extract-word-timestamps   – Extract word-level timestamps
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.audio.schemas import (
    TranscribeRequest,
    BatchTranscribeRequest,
    SubtitleRequest,
    ExtractWordsRequest,
)
from features.audio.subtitles import (
    turn_speech_into_text,
    turn_many_files_into_text,
    make_srt_subtitles,
    make_vtt_subtitles,
    get_word_times,
)

logger = logging.getLogger("sonikoma.api.audio.subtitles")
router = APIRouter()


@router.post("/transcribe-audio", summary="Transcribe speech from audio via Whisper")
async def transcribe_audio_endpoint(body: TranscribeRequest):
    """Transcribes an audio file using OpenAI Whisper and returns text and segments."""
    try:
        result = await turn_speech_into_text(
            body.audio_path,
            model_name=body.model_name,
            language=body.language,
            task=body.task or "transcribe",
            verbose=bool(body.verbose)
        )
        return {
            "success": True,
            "text": result["text"],
            "language": result["language"],
            "duration": result["duration"],
            "confidence": result["confidence"],
            "segments": result["segments"]
        }
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Subtitles API] Transcription failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/transcribe-audio-batch", summary="Batch transcribe multiple audio files")
async def batch_transcribe_endpoint(body: BatchTranscribeRequest):
    """Transcribes an array of audio files sequentially."""
    try:
        results = await turn_many_files_into_text(
            body.audio_paths,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "results": results}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Subtitles API] Batch transcribe failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-srt-subtitles", summary="Generate SRT subtitle file from audio")
async def generate_srt_endpoint(body: SubtitleRequest):
    """Generates standard .srt subtitle files with sequential numbers and timestamps."""
    try:
        srt_path = await make_srt_subtitles(
            body.audio_path,
            output_path=body.output_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "srt_path": srt_path}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Subtitles API] SRT generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-vtt-subtitles", summary="Generate WebVTT subtitle file from audio")
async def generate_vtt_endpoint(body: SubtitleRequest):
    """Generates HTML5 WebVTT (.vtt) files for web and mobile players."""
    try:
        vtt_path = await make_vtt_subtitles(
            body.audio_path,
            output_path=body.output_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "vtt_path": vtt_path}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Subtitles API] VTT generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-word-timestamps", summary="Extract word-level timestamps from audio")
async def extract_words_endpoint(body: ExtractWordsRequest):
    """Extracts start/end timestamps for every spoken word for kinetic animations."""
    try:
        words = await get_word_times(
            body.audio_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "words": words}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Subtitles API] Word timestamps failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
