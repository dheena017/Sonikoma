"""
backend/features/audio/analysis/energy_split_service.py
─────────────────────────────────────────────────────────────────────────────
Audio energy segmenter: divides an audio track into lively versus calm moments
based on energy changes to guide rhythmic video motion pacing.
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
import numpy as np

try:
    import librosa
except ImportError:
    librosa = None

from ai_engine.providers.librosa.engine import get_librosa_engine

logger = logging.getLogger("sonikoma.audio.analysis.energy")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _find_loud_and_quiet_cuts(
    energy: np.ndarray,
    cutoff: float,
    max_cuts: int,
    step_len: int,
    sample_rate: int
) -> List[Dict[str, Any]]:
    """Partitions continuous energy curves into discrete segments at energy boundary shifts."""
    boundaries = np.where(np.diff(energy > cutoff) != 0)[0]
    segments = []
    prev_b = 0

    for i, b in enumerate(boundaries[:max_cuts]):
        s_time = librosa.frames_to_time(prev_b, sr=sample_rate, hop_length=step_len)
        e_time = librosa.frames_to_time(b, sr=sample_rate, hop_length=step_len)
        mean_e = float(np.mean(energy[prev_b:b])) if b > prev_b else 0.0

        segments.append({
            "segment_id": i,
            "start_time": round(float(s_time), 3),
            "end_time": round(float(e_time), 3),
            "duration": round(float(e_time - s_time), 3),
            "mean_energy": round(mean_e, 4),
        })
        prev_b = b

    # Final trailing piece
    if len(segments) < max_cuts and prev_b < len(energy):
        s_time = librosa.frames_to_time(prev_b, sr=sample_rate, hop_length=step_len)
        e_time = librosa.frames_to_time(len(energy), sr=sample_rate, hop_length=step_len)
        segments.append({
            "segment_id": len(segments),
            "start_time": round(float(s_time), 3),
            "end_time": round(float(e_time), 3),
            "duration": round(float(e_time - s_time), 3),
            "mean_energy": round(float(np.mean(energy[prev_b:])), 4),
        })

    return segments


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def split_audio_by_energy(
    audio_path: str,
    num_segments: int = 10,
    energy_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Divides an audio track into lively versus calm moments for video motion pacing.
    """
    if librosa is None:
        raise RuntimeError("librosa is required for audio energy segmentation.")

    engine = get_librosa_engine()
    y, sr = await engine.load_audio(audio_path)
    energy = await asyncio.to_thread(engine._compute_energy, y)

    cutoff = energy_threshold if energy_threshold is not None else float(np.mean(energy) * 0.5)
    hop_len = getattr(engine, "hop_length", 512)

    segments = _find_loud_and_quiet_cuts(energy, cutoff, num_segments, hop_len, sr)
    logger.info(f"✓ Split audio into {len(segments)} energy segments")
    return segments


__all__ = ["split_audio_by_energy"]
