"""
backend/app/engines/librosa/engine.py
Librosa engine moved into package structure.
"""

import logging
import asyncio
from typing import Tuple, Optional
from dataclasses import dataclass
import numpy as np

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    librosa = None
    sf = None
    LIBROSA_AVAILABLE = False

logger = logging.getLogger("sonikoma.services.librosa_engine")


@dataclass
class AudioFeatures:
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
    start_time: float
    end_time: float
    duration: float
    threshold_db: float


@dataclass
class EnergySegment:
    segment_id: int
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float
    duration: float
    mean_energy: float


class LibrosaEngine:
    def __init__(self, sr: int = 22050):
        if not LIBROSA_AVAILABLE:
            raise RuntimeError(
                "librosa and soundfile required. Install with: pip install librosa soundfile"
            )

        self.sr = sr
        self.hop_length = 512
        self.n_fft = 2048
        logger.info(f"✓ Librosa Engine initialized (sr={sr}Hz, hop_length={self.hop_length})")

    async def load_audio(self, audio_path: str, duration: Optional[float] = None) -> Tuple[np.ndarray, int]:
        try:
            y, sr = await asyncio.to_thread(
                librosa.load, audio_path,
                sr=self.sr,
                duration=duration,
                mono=True
            )
            logger.info(f"✓ Loaded audio: {len(y)} samples, {sr}Hz, duration={len(y)/sr:.2f}s")
            return y, sr
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            raise

    # ... (other feature extraction helpers copied from original)


_librosa_instance: Optional[LibrosaEngine] = None


def get_librosa_engine(sr: int = 22050) -> LibrosaEngine:
    if not LIBROSA_AVAILABLE:
        raise ImportError(
            "librosa and soundfile required. Install with: pip install librosa soundfile"
        )
    global _librosa_instance
    if _librosa_instance is None:
        _librosa_instance = LibrosaEngine(sr=sr)
    return _librosa_instance
