"""
backend/features/audio/analysis/sound_info_service.py
─────────────────────────────────────────────────────────────────────────────
Audio summary analyzer: inspects sound physics and acoustic properties,
including duration, sample rate, tempo BPM, volume range, and beats.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any
import numpy as np

try:
    import librosa
except ImportError:
    librosa = None

from ai_engine.providers.librosa.engine import get_librosa_engine

logger = logging.getLogger("sonikoma.audio.analysis.info")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _read_sound_stats(
    features: Any
) -> Dict[str, Any]:
    """Formats raw Librosa feature arrays into clean dictionary summaries."""
    return {
        "duration_seconds": round(float(features.duration), 2),
        "sample_rate": int(features.sample_rate),
        "tempo_bpm": round(float(features.tempo), 1),
        "energy": {
            "mean": round(float(np.mean(features.energy)), 4),
            "max": round(float(np.max(features.energy)), 4),
            "min": round(float(np.min(features.energy)), 4),
        },
        "spectral_centroid_hz": round(float(np.mean(features.spectral_centroid)), 1),
        "zero_crossing_rate": round(float(np.mean(features.zero_crossing_rate)), 4),
        "beat_count": len(features.beats),
        "beat_times": [round(float(b), 3) for b in features.beats[:32]],  # first 32 beats preview
    }


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def check_sound_details(
    audio_path: str
) -> Dict[str, Any]:
    """
    Reports audio details: total length, music speed tempo (BPM), loudness range, and musical beats.
    """
    if librosa is None:
        raise RuntimeError("librosa is required for acoustic feature extraction.")

    engine = get_librosa_engine()
    features = await engine.extract_all_features(audio_path)
    return _read_sound_stats(features)


__all__ = ["check_sound_details"]
