"""
backend/app/api/v1/audio.py
─────────────────────────────────────────────────────────────────────────────
FastAPI routes for TTS generation, dialogue-OCR alignment, Whisper STT,
and audio waveform analysis. Acts as a thin controller delegating logic to services.
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

from services.audio import (
    generate_tts_audio,
    get_available_voices,
    align_dialogue_service,
    analyze_audio_service,
    detect_silence_service,
    segment_by_energy_service,
    load_audio_service,
    transcribe_audio_service,
    generate_srt_service,
    generate_vtt_service,
    extract_words_service,
    batch_transcribe_service,
)

logger = logging.getLogger("sonikoma.api.audio")
audio_router = APIRouter()
router = audio_router


class AudioAnalyzeRequest(AudioPathRequest):
    pass


def _default_output_path(suffix: str) -> str:
    return os.path.join(tempfile.gettempdir(), f"whisper_{os.urandom(4).hex()}{suffix}")


# ─── 1. Text-To-Speech Synthesis ─────────────────────────────────────────────

@router.post("/tts", summary="Generate TTS panel audio")
async def generate_tts_endpoint(body: AudioGenerateRequest):
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


@router.get("/voices", summary="List available Edge-TTS voices")
async def list_voices_endpoint():
    voices = get_available_voices()
    return JSONResponse(content={"success": True, "voices": voices})


# ─── 2. Dialogue & Waveform Alignment ────────────────────────────────────────

@router.post("/align/{panel_id}", summary="Align OCR text to Whisper transcript and extract audio peaks")
async def align_dialogue_endpoint(panel_id: str, body: AlignDialogueRequest):
    try:
        result = await align_dialogue_service(panel_id=panel_id, audio_url=body.audio_url, ocr_texts=body.ocr_texts)
        return result
    except Exception as e:
        logger.error(f"[Dialogue Alignment API Error] failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ─── 3. Audio Analysis & Segmentation ────────────────────────────────────────

@router.post("/analyze", summary="Extract audio waveform summary statistics")
async def analyze_audio_endpoint(body: AudioAnalyzeRequest):
    try:
        stats = await analyze_audio_service(body.audio_path)
        return {"success": True, "analysis": stats}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"Audio analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/silence", summary="Detect silence segments in audio")
async def detect_silence_endpoint(body: SilenceDetectRequest):
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


@router.post("/segments", summary="Segment audio by energy levels")
async def segment_audio_by_energy_endpoint(body: EnergySegmentRequest):
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


# ─── 4. Whisper STT Transcription & Subtitles ────────────────────────────────

@router.post("/transcribe", summary="Transcribe audio to text via Whisper")
async def transcribe_audio_endpoint(body: TranscribeRequest):
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


@router.post("/transcribe/batch", summary="Transcribe multiple audio files")
async def batch_transcribe_audio_endpoint(body: BatchTranscribeRequest):
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


@router.post("/subtitles/srt", summary="Generate SRT subtitle file")
async def generate_srt_subtitles_endpoint(body: SubtitleRequest):
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


@router.post("/subtitles/vtt", summary="Generate WebVTT subtitle file")
async def generate_vtt_subtitles_endpoint(body: SubtitleRequest):
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


@router.post("/timestamps", summary="Extract word-level timestamps from audio")
async def extract_word_timestamps_endpoint(body: ExtractWordsRequest):
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
