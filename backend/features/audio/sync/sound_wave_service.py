"""
backend/features/audio/sync/sound_wave_service.py
─────────────────────────────────────────────────────────────────────────────
Audio waveform envelope extractor: measures frame-by-frame loudness peaks
(RMS energy) so speech bubbles can pulsate, bounce, or highlight to spoken voices.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import List, Tuple
import numpy as np

try:
    import librosa
except ImportError:
    librosa = None

from ai_engine.providers.librosa.engine import get_librosa_engine

logger = logging.getLogger("sonikoma.audio.sync.sound_wave")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _smooth_sound_waves(raw_wave: np.ndarray) -> List[float]:
    """Normalizes RMS values between 0.0 and 1.0, cleaning NaN and infinite spikes."""
    clean = np.nan_to_num(raw_wave, nan=0.0, posinf=1.0, neginf=0.0)
    if len(clean) == 0:
        return []

    max_val = np.max(clean)
    if max_val > 0 and np.isfinite(max_val):
        normalized = clean / max_val
    else:
        normalized = clean

    return [round(float(v), 3) for v in normalized]


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def get_sound_waves(
    audio_path: str,
    step_size: int = 512,
    window_size: int = 2048
) -> Tuple[List[float], float]:
    """
    Gets sound loudness waves so speech bubbles can pulse and react to character voices.
    Returns: (peaks_list, peaks_fps)
    """
    if librosa is None:
        logger.warning("librosa is not available; returning empty sound wave peaks.")
        return [], 0.0

    try:
        engine = get_librosa_engine()
        sr_rate = getattr(engine, "sr", 22050)
        y, sr = librosa.load(audio_path, sr=sr_rate, mono=True)
        rms = librosa.feature.rms(y=y, frame_length=window_size, hop_length=step_size)[0]
        peaks = _smooth_sound_waves(rms)
        peaks_fps = sr / float(step_size)
        return peaks, round(peaks_fps, 2)
    except Exception as exc:
        logger.warning(f"Failed to extract sound wave peaks from {audio_path}: {exc}")
        return [], 0.0


__all__ = ["get_sound_waves"]
