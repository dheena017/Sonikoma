"""
backend/app/providers/librosa/helpers.py
─────────────────────────────────────────────────────────────────────────────
Audio math, decibel calculations, and time alignment helper utilities.
─────────────────────────────────────────────────────────────────────────────
"""

import math
from typing import Tuple


def frames_to_time(frames: int, hop_length: int = 512, sr: int = 22050) -> float:
    """Convert STFT frame index into continuous timestamp in seconds."""
    return (frames * hop_length) / float(sr)


def time_to_frames(time_sec: float, hop_length: int = 512, sr: int = 22050) -> int:
    """Convert timestamp in seconds into the nearest STFT frame index."""
    return round((time_sec * sr) / float(hop_length))


def amplitude_to_db(amplitude: float, amin: float = 1e-5) -> float:
    """Safely convert linear amplitude into decibels (dB)."""
    return 20.0 * math.log10(max(amplitude, amin))
