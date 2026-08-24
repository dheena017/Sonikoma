"""
backend/app/api/v1/audio/analysis.py
─────────────────────────────────────────────────────────────────────────────
Audio signal analysis and segmentation endpoints.
POST /analyze     – Extract waveform summary statistics (RMS, peaks, LUFS)
POST /silence     – Detect silence segments by dB threshold and duration
POST /segments    – Segment audio by energy levels
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, HTTPException

from schemas.audio import AudioPathRequest, SilenceDetectRequest, EnergySegmentRequest
from services.audio import analyze_audio_service, detect_silence_service, segment_by_energy_service

logger = logging.getLogger("sonikoma.api.audio.analysis")
router = APIRouter()


class AudioAnalyzeRequest(AudioPathRequest):
    pass


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/analyze", summary="Extract audio waveform summary statistics")
async def analyze_audio_endpoint(body: AudioAnalyzeRequest):
    """
    Analyzes an audio file and returns spectral summary statistics:
    RMS energy, peak amplitude, estimated LUFS, duration, and sample rate.
    """
    try:
        stats = await analyze_audio_service(body.audio_path)
        return {"success": True, "analysis": stats}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Analysis] Waveform analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/silence", summary="Detect silence segments in audio")
async def detect_silence_endpoint(body: SilenceDetectRequest):
    """
    Scans an audio file for silent regions below the specified dB threshold
    that persist for at least `min_duration` seconds.
    Returns a list of silence windows: [{start, end, duration}].
    """
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
        logger.error(f"[Analysis] Silence detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/segments", summary="Segment audio by energy levels")
async def segment_audio_by_energy_endpoint(body: EnergySegmentRequest):
    """
    Divides an audio file into N energy-based segments, each containing
    its start/end times, average energy, and peak amplitude.
    Useful for pacing and animation timing.
    """
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
        logger.error(f"[Analysis] Energy segmentation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
