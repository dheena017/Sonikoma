"""
backend/python/routes/librosa_routes.py
─────────────────────────────────────────────────────────────────────────────
Audio analysis routes powered by Librosa.
"""

import os
import sys
import tempfile
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.librosa_engine import get_librosa_engine

logger = logging.getLogger("sonikoma.routes.librosa_routes")
router = APIRouter()
librosa_engine = get_librosa_engine()


class AudioPathRequest(BaseModel):
    audio_path: str


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
        stats = await librosa_engine.extract_summary_stats(body.audio_path)
        return {"success": True, "analysis": stats}
    except Exception as exc:
        logger.error(f"Audio analysis failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/detect-silence", summary="Detect silence segments in audio")
async def detect_silence(body: SilenceDetectRequest):
    try:
        segments = await librosa_engine.detect_silence(body.audio_path, threshold_db=body.threshold_db, min_duration=body.min_duration)
        return {"success": True, "silence_segments": [s.__dict__ for s in segments]}
    except Exception as exc:
        logger.error(f"Silence detection failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/segment-by-energy", summary="Segment audio by energy levels")
async def segment_by_energy(body: EnergySegmentRequest):
    try:
        segments = await librosa_engine.segment_by_energy(body.audio_path, num_segments=body.num_segments, energy_threshold=body.energy_threshold)
        return {"success": True, "segments": [s.__dict__ for s in segments]}
    except Exception as exc:
        logger.error(f"Energy segmentation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/load", summary="Load audio metadata and shape")
async def load_audio(body: AudioPathRequest):
    try:
        y, sr = await librosa_engine.load_audio(body.audio_path)
        return {"success": True, "duration_seconds": len(y) / sr, "sample_rate": sr, "samples": len(y)}
    except Exception as exc:
        logger.error(f"Load audio failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))
