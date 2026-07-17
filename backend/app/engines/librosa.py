"""
backend/python/services/librosa_engine.py
─────────────────────────────────────────────────────────────────────────────
Librosa-based audio analysis engine for feature extraction and analysis:
- Extract MFCC (Mel-frequency cepstral coefficients)
- Detect silence/speech
- Extract spectral features (centroid, bandwidth, flux)
- Detect tempo/BPM
- Extract chroma features
- Segment audio by energy/silence
- Visualize spectrograms
─────────────────────────────────────────────────────────────────────────────
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
    """Container for extracted audio features."""
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
    """Silence detection result."""
    start_time: float
    end_time: float
    duration: float
    threshold_db: float


@dataclass
class EnergySegment:
    """Energy-based audio segmentation."""
    segment_id: int
    start_frame: int
    end_frame: int
    start_time: float
    end_time: float
    duration: float
    mean_energy: float


class LibrosaEngine:
    """High-level Librosa wrapper for audio feature extraction and analysis."""

    def __init__(self, sr: int = 22050):
        """
        Initialize Librosa engine.

        Args:
            sr: Sample rate for audio loading (Hz)
        """
        if not LIBROSA_AVAILABLE:
            raise RuntimeError(
                "librosa and soundfile required. Install with: pip install librosa soundfile"
            )

        self.sr = sr
        self.hop_length = 512
        self.n_fft = 2048
        logger.info(f"✓ Librosa Engine initialized (sr={sr}Hz, hop_length={self.hop_length})")

    async def load_audio(self, audio_path: str, duration: Optional[float] = None) -> Tuple[np.ndarray, int]:
        """
        Load audio file asynchronously.

        Args:
            audio_path: Path to audio file
            duration: Load only first N seconds (None = full)

        Returns:
            Tuple of (audio array, sample rate)
        """
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

    async def extract_all_features(self, audio_path: str) -> AudioFeatures:
        """
        Extract comprehensive audio features.

        Args:
            audio_path: Path to audio file

        Returns:
            AudioFeatures object with all extracted features
        """
        y, sr = await self.load_audio(audio_path)
        duration = len(y) / sr

        logger.info(f"Extracting features from {audio_path}...")

        # Asynchronously compute all features
        (energy, mfcc, spectral_centroid, spectral_bandwidth,
         spectral_rolloff, zcr, chroma, tempo, beats) = await asyncio.gather(
            asyncio.to_thread(self._compute_energy, y),
            asyncio.to_thread(self._compute_mfcc, y),
            asyncio.to_thread(self._compute_spectral_centroid, y),
            asyncio.to_thread(self._compute_spectral_bandwidth, y),
            asyncio.to_thread(self._compute_spectral_rolloff, y),
            asyncio.to_thread(self._compute_zero_crossing_rate, y),
            asyncio.to_thread(self._compute_chroma, y),
            asyncio.to_thread(self._detect_tempo, y),
            asyncio.to_thread(self._detect_beats, y),
        )

        features = AudioFeatures(
            duration=duration,
            sample_rate=sr,
            energy=energy,
            mfcc=mfcc,
            spectral_centroid=spectral_centroid,
            spectral_bandwidth=spectral_bandwidth,
            spectral_rolloff=spectral_rolloff,
            zero_crossing_rate=zcr,
            chroma=chroma,
            tempo=tempo,
            beats=beats
        )

        logger.info(f"✓ Feature extraction complete. Tempo: {tempo:.1f} BPM")
        return features

    def _compute_energy(self, y: np.ndarray) -> np.ndarray:
        """Compute short-time energy."""
        return np.sqrt(np.sum(librosa.stft(y, n_fft=self.n_fft) ** 2, axis=0))

    def _compute_mfcc(self, y: np.ndarray, n_mfcc: int = 13) -> np.ndarray:
        """Compute Mel-frequency cepstral coefficients."""
        return librosa.feature.mfcc(y=y, sr=self.sr, n_mfcc=n_mfcc, n_fft=self.n_fft, hop_length=self.hop_length)

    def _compute_spectral_centroid(self, y: np.ndarray) -> np.ndarray:
        """Compute spectral centroid."""
        return librosa.feature.spectral_centroid(y=y, sr=self.sr, n_fft=self.n_fft, hop_length=self.hop_length)[0]

    def _compute_spectral_bandwidth(self, y: np.ndarray) -> np.ndarray:
        """Compute spectral bandwidth."""
        return librosa.feature.spectral_bandwidth(y=y, sr=self.sr, n_fft=self.n_fft, hop_length=self.hop_length)[0]

    def _compute_spectral_rolloff(self, y: np.ndarray) -> np.ndarray:
        """Compute spectral rolloff."""
        return librosa.feature.spectral_rolloff(y=y, sr=self.sr, n_fft=self.n_fft, hop_length=self.hop_length)[0]

    def _compute_zero_crossing_rate(self, y: np.ndarray) -> np.ndarray:
        """Compute zero-crossing rate."""
        return librosa.feature.zero_crossing_rate(y, hop_length=self.hop_length)[0]

    def _compute_chroma(self, y: np.ndarray) -> np.ndarray:
        """Compute chroma features."""
        return librosa.feature.chroma_stft(y=y, sr=self.sr, n_fft=self.n_fft, hop_length=self.hop_length)

    def _detect_tempo(self, y: np.ndarray) -> float:
        """Detect tempo (BPM)."""
        onset_env = librosa.onset.onset_strength(y=y, sr=self.sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=self.sr)
        return float(tempo)

    def _detect_beats(self, y: np.ndarray) -> np.ndarray:
        """Detect beat frames."""
        onset_env = librosa.onset.onset_strength(y=y, sr=self.sr)
        _, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=self.sr)
        return librosa.frames_to_time(beats, sr=self.sr)






# Singleton instance
_librosa_instance: Optional[LibrosaEngine] = None


def get_librosa_engine(sr: int = 22050) -> LibrosaEngine:
    """Get or create Librosa engine singleton."""
    global _librosa_instance
    if not LIBROSA_AVAILABLE:
        raise ImportError(
            "librosa and soundfile required. Install with: pip install librosa soundfile"
        )
    if _librosa_instance is None:
        _librosa_instance = LibrosaEngine(sr=sr)
    return _librosa_instance
