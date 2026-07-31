"""
backend/app/api/v1/audio.py
─────────────────────────────────────────────────────────────────────────────
FastAPI routes for TTS generation, dialogue-OCR alignment, Whisper STT,
and Librosa audio analysis. Acts as a thin controller delegating logic to services.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from schemas.audio import (
    AlignDialogueRequest,
    AudioGenerateRequest,
    AudioPathRequest,
    SilenceDetectRequest,
    EnergySegmentRequest,
    TranscribeRequest,
    SubtitleRequest,
    ExtractWordsRequest,
    BatchTranscribeRequest
)

from services.audio.tts_service import generate_tts_audio, get_available_voices
from services.audio.alignment_service import (
    align_dialogue_service,
    analyze_audio_service,
    detect_silence_service,
    segment_by_energy_service,
    load_audio_service,
    transcribe_audio_service,
    generate_srt_service,
    generate_vtt_service,
    extract_words_service,
    batch_transcribe_service
)

logger = logging.getLogger("sonikoma.api.audio")
audio_router = APIRouter()
router = audio_router

# Aliases expected by api/router.py
librosa_router = APIRouter()
whisper_router = APIRouter()


class AudioAnalyzeRequest(AudioPathRequest):
    pass


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"whisper_{os.urandom(4).hex()}{suffix}")


@router.post("/align-dialogue/{panel_id}", summary="Align OCR text to Whisper transcript and extract audio peaks")
async def align_dialogue(panel_id: str, body: AlignDialogueRequest):
    try:
        result = await align_dialogue_service(panel_id=panel_id, audio_url=body.audio_url, ocr_texts=body.ocr_texts)
        return result
    except Exception as e:
        logger.error(f"[Dialogue Alignment API Error] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate", summary="Generate TTS panel audio")
async def generate_audio(body: AudioGenerateRequest):
    try:
        result = await generate_tts_audio(
            dialogue_list=body.dialogue_list,
            target_duration=body.target_duration,
            voice=body.voice,
            speech_rate=body.speech_rate if body.speech_rate is not None else 1.0,
            speech_pitch=body.speech_pitch if body.speech_pitch is not None else 1.0,
            return_base64=body.return_base64
        )
        return JSONResponse(content=result)
    except Exception as exc:
        logger.error(f"Audio generation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/voices", summary="List available Edge-TTS voices (subset)")
async def list_voices():
    voices = get_available_voices()
    return JSONResponse(content={"success": True, "voices": voices})


@router.post("/analyze", summary="Extract audio summary statistics")
async def analyze_audio(body: AudioAnalyzeRequest):
    try:
        stats = await analyze_audio_service(body.audio_path)
        return {"success": True, "analysis": stats}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Audio analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-silence", summary="Detect silence segments in audio")
async def detect_silence(body: SilenceDetectRequest):
    try:
        segments = await detect_silence_service(
            body.audio_path,
            threshold_db=body.threshold_db,
            min_duration=body.min_duration
        )
        return {"success": True, "silence_segments": segments}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Silence detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/segment-by-energy", summary="Segment audio by energy levels")
async def segment_by_energy(body: EnergySegmentRequest):
    try:
        segments = await segment_by_energy_service(
            body.audio_path,
            num_segments=body.num_segments,
            energy_threshold=body.energy_threshold
        )
        return {"success": True, "segments": segments}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Energy segmentation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/load", summary="Load audio metadata and shape")
async def load_audio(body: AudioPathRequest):
    try:
        result = await load_audio_service(body.audio_path)
        return {
            "success": True,
            "duration_seconds": result["duration_seconds"],
            "sample_rate": result["sample_rate"],
            "samples": result["samples"]
        }
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Load audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/transcribe", summary="Transcribe audio to text")
async def transcribe(body: TranscribeRequest):
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
        logger.error(f"Transcription failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-srt", summary="Generate SRT subtitle file")
async def generate_srt(body: SubtitleRequest):
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
        logger.error(f"Generate SRT failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/generate-vtt", summary="Generate WebVTT subtitle file")
async def generate_vtt(body: SubtitleRequest):
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
        logger.error(f"Generate VTT failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/extract-words", summary="Extract word-level timestamps from audio")
async def extract_words(body: ExtractWordsRequest):
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
        logger.error(f"Extract words failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/batch-transcribe", summary="Transcribe multiple audio files")
async def batch_transcribe(body: BatchTranscribeRequest):
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
        logger.error(f"Batch transcribe failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
