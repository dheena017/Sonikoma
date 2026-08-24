"""
backend/app/api/v1/audio/transcription.py
─────────────────────────────────────────────────────────────────────────────
Whisper speech-to-text transcription and subtitle generation endpoints.
POST /transcribe            – Transcribe audio to text (Whisper)
POST /transcribe/batch      – Batch transcribe multiple audio files
POST /subtitles/srt         – Generate SRT caption file
POST /subtitles/vtt         – Generate WebVTT caption file
POST /timestamps            – Extract word-level timestamps
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging

from fastapi import APIRouter, HTTPException

from schemas.audio import (
    TranscribeRequest,
    BatchTranscribeRequest,
    SubtitleRequest,
    ExtractWordsRequest
)
from services.audio import (
    transcribe_audio_service,
    batch_transcribe_service,
    generate_srt_service,
    generate_vtt_service,
    extract_words_service,
)

logger = logging.getLogger("sonikoma.api.audio.transcription")
router = APIRouter()


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"whisper_{os.urandom(4).hex()}{suffix}")


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/transcribe", summary="Transcribe audio to text via Whisper")
async def transcribe_audio_endpoint(body: TranscribeRequest):
    """
    Transcribes a local audio file using OpenAI Whisper.
    Returns the full transcript text, detected language, duration,
    per-segment timing, and a confidence score.
    """
    try:
        result = await transcribe_audio_service(
            body.audio_path,
            model_name=body.model_name,
            language=body.language,
            task=body.task,
            verbose=body.verbose
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
        logger.error(f"[Transcription] Transcription failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/transcribe/batch", summary="Transcribe multiple audio files")
async def batch_transcribe_audio_endpoint(body: BatchTranscribeRequest):
    """
    Transcribes a batch of audio files in sequence using the specified
    Whisper model. Returns an array of transcription results.
    """
    try:
        results = await batch_transcribe_service(
            body.audio_paths,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "results": results}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Transcription] Batch transcription failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/subtitles/srt", summary="Generate SRT subtitle file")
async def generate_srt_subtitles_endpoint(body: SubtitleRequest):
    """
    Transcribes audio with Whisper and writes the output as an `.srt` subtitle
    file with sequential numbered entries and HH:MM:SS,mmm timestamps.
    """
    output_path = body.output_path or _default_output_path(".srt")
    try:
        result_path = await generate_srt_service(
            body.audio_path,
            output_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "srt_path": result_path}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Transcription] SRT generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/subtitles/vtt", summary="Generate WebVTT subtitle file")
async def generate_vtt_subtitles_endpoint(body: SubtitleRequest):
    """
    Transcribes audio with Whisper and writes the output as a `.vtt` WebVTT
    subtitle file compatible with HTML5 `<track>` elements and video players.
    """
    output_path = body.output_path or _default_output_path(".vtt")
    try:
        result_path = await generate_vtt_service(
            body.audio_path,
            output_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "vtt_path": result_path}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Transcription] VTT generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/timestamps", summary="Extract word-level timestamps from audio")
async def extract_word_timestamps_endpoint(body: ExtractWordsRequest):
    """
    Uses Whisper's word-level timestamp mode to extract precise start/end
    times for each spoken word. Useful for karaoke, animated captions, and
    panel-level audio syncing.
    """
    try:
        words = await extract_words_service(
            body.audio_path,
            model_name=body.model_name,
            language=body.language
        )
        return {"success": True, "words": words}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Transcription] Word timestamp extraction failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
