"""
backend/app/providers/librosa/client.py
─────────────────────────────────────────────────────────────────────────────
Librosa audio file loading and acoustic format client interface.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Tuple, Optional
import numpy as np

logger = logging.getLogger("sonikoma.providers.librosa.client")

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    librosa = None
    sf = None
    LIBROSA_AVAILABLE = False


class LibrosaClient:
    """Client for reading, verifying, and decoding audio waveforms."""

    @staticmethod
    def is_available() -> bool:
        return LIBROSA_AVAILABLE and librosa is not None

    @classmethod
    def load_audio(
        cls,
        audio_path: str,
        sr: Optional[int] = 22050,
        mono: bool = True
    ) -> Tuple[np.ndarray, int]:
        """Decode and load audio file into a NumPy floating point waveform."""
        if not cls.is_available():
            raise RuntimeError("librosa is not installed.")
        y, sample_rate = librosa.load(audio_path, sr=sr, mono=mono)
        return y, sample_rate

    @classmethod
    def get_duration(cls, audio_path: str) -> float:
        """Quickly determine the duration in seconds of an audio file."""
        if not cls.is_available():
            raise RuntimeError("librosa is not installed.")
        return float(librosa.get_duration(path=audio_path))
