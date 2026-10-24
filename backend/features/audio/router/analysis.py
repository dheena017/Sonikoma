"""
backend/features/audio/router/analysis.py
─────────────────────────────────────────────────────────────────────────────
Audio signal analysis and energy segmentation endpoints:
POST /analyze-audio           – Waveform statistics (duration, tempo BPM, energy)
POST /detect-silence          – Silence interval detection by dB threshold
POST /segment-audio-by-energy – Energy segmentation for video camera pacing
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.audio.schemas import AudioPathRequest, SilenceDetectRequest, EnergySegmentRequest
from features.audio.analysis import (
    check_sound_details,
    find_silent_parts,
    split_audio_by_energy,
)

logger = logging.getLogger("sonikoma.api.audio.analysis")
router = APIRouter()


class AudioAnalyzeRequest(AudioPathRequest):
    pass


@router.post("/analyze-audio", summary="Extract audio waveform summary statistics")
async def analyze_audio_endpoint(body: AudioAnalyzeRequest):
    """Analyzes an audio file and returns duration, tempo BPM, energy, and beat times."""
    try:
        stats = await check_sound_details(body.audio_path)
        return {"success": True, "analysis": stats}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Analysis API] Analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-silence", summary="Detect silence segments in audio")
async def detect_silence_endpoint(body: SilenceDetectRequest):
    """Scans audio for silent regions below the specified dB threshold."""
    try:
        segments = await find_silent_parts(
            body.audio_path,
            threshold_db=body.threshold_db or -40.0,
            min_duration=body.min_duration or 0.5
        )
        return {"success": True, "silence_segments": segments}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Analysis API] Silence detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/segment-audio-by-energy", summary="Segment audio by energy levels")
async def segment_energy_endpoint(body: EnergySegmentRequest):
    """Divides an audio track into energy segments for rhythmic video motion pacing."""
    try:
        segments = await split_audio_by_energy(
            body.audio_path,
            num_segments=body.num_segments or 10,
            energy_threshold=body.energy_threshold
        )
        return {"success": True, "segments": segments}
    except ValueError as val_err:
        raise HTTPException(status_code=503, detail=str(val_err))
    except Exception as exc:
        logger.error(f"[Analysis API] Energy segmentation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
