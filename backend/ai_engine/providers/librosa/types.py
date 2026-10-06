"""
backend/app/providers/librosa/types.py
─────────────────────────────────────────────────────────────────────────────
Audio feature representations, energy segments, and silence interval contracts.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from typing import Optional, Any
import numpy as np


@dataclass
class AudioFeatures:
    """Extracted acoustic and spectral audio features."""
    duration: float
    sample_rate: int
    energy: np.ndarray
    mfcc: np.ndarray
    spectral_centroid: np.ndarray
    spectral_bandwidth: np.ndarray
    spectral_rolloff: np.ndarray
    zero_crossing_rate: np.ndarray
    chroma: np.ndarray
    tempo: float
    beats: np.ndarray


@dataclass
class SilenceSegment:
    """Detected non-speech silence interval."""
    start_time: float
    end_time: float
    duration: float
    threshold_db: float


@dataclass
class EnergySegment:
    """High or normalized energy activity block."""
    segment_id: int
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float
    duration: float
    mean_energy: float
