"""
backend/features/audio/analysis/silence_finder_service.py
─────────────────────────────────────────────────────────────────────────────
Silence detector: scans an audio file to locate quiet intervals, pauses,
and dead air based on a decibel threshold and minimum duration.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Dict, Any
import numpy as np

try:
    import librosa
except ImportError:
    librosa = None

from ai_engine.providers.librosa.engine import get_librosa_engine, SilenceSegment

logger = logging.getLogger("sonikoma.audio.analysis.silence")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _find_quiet_spots(
    energy_levels_db: np.ndarray,
    cutoff_db: float,
    min_gap_s: float,
    frame_times: np.ndarray
) -> List[Dict[str, Any]]:
    """Identifies time intervals where decibel energy stays strictly below cutoff."""
    silence_frames = energy_levels_db < cutoff_db
    segments: List[Dict[str, Any]] = []
    in_silence = False
    start_time = 0.0

    for idx, (t, is_silent) in enumerate(zip(frame_times, silence_frames)):
        if is_silent and not in_silence:
            start_time = float(t)
            in_silence = True
        elif not is_silent and in_silence:
            duration = float(t - start_time)
            if duration >= min_gap_s:
                segments.append({
                    "start_time": round(start_time, 3),
                    "end_time": round(float(t), 3),
                    "duration": round(duration, 3),
                    "threshold_db": cutoff_db,
                })
            in_silence = False

    if in_silence and len(frame_times) > 0:
        duration = float(frame_times[-1] - start_time)
        if duration >= min_gap_s:
            segments.append({
                "start_time": round(start_time, 3),
                "end_time": round(float(frame_times[-1]), 3),
                "duration": round(duration, 3),
                "threshold_db": cutoff_db,
            })

    return segments


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def find_silent_parts(
    audio_path: str,
    threshold_db: float = -40.0,
    min_duration: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Finds quiet moments and silent pauses in an audio recording.
    """
    if librosa is None:
        raise RuntimeError("librosa is required for audio silence detection.")

    engine = get_librosa_engine()
    y, sr = await engine.load_audio(audio_path)

    # Compute Mel spectrogram and decibel power
    spec = librosa.feature.melspectrogram(y=y, sr=sr)
    spec_db = librosa.power_to_db(spec, ref=np.max)
    energy_db = np.mean(spec_db, axis=0)

    hop_len = getattr(engine, "hop_length", 512)
    times = librosa.frames_to_time(np.arange(len(energy_db)), sr=sr, hop_length=hop_len)

    segments = _find_quiet_spots(energy_db, threshold_db, min_duration, times)
    logger.info(f"✓ Found {len(segments)} silent segments in {audio_path}")
    return segments


__all__ = ["find_silent_parts"]
