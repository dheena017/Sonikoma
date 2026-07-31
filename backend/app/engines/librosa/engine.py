"""
backend/app/engines/librosa/engine.py
Librosa engine moved into package structure.
"""

import logging
import asyncio
from typing import Tuple, Optional, Dict, Any, List, cast
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
        logger.debug(f"✓ Librosa Engine initialized (sr={sr}Hz, hop_length={self.hop_length})")

    async def load_audio(self, audio_path: str, duration: Optional[float] = None) -> Tuple[np.ndarray, int]:
        if librosa is None:
            raise RuntimeError("librosa is not available")
        try:
            y, sr = await asyncio.to_thread(
                librosa.load, audio_path,
                sr=self.sr,
                duration=duration,
                mono=True
            )
            logger.info(f"✓ Loaded audio: {len(y)} samples, {sr}Hz, duration={len(y)/sr:.2f}s")
            return y, int(sr)
        except Exception as e:
            logger.error(f"Failed to load audio: {e}")
            raise

    def _compute_energy(self, y: np.ndarray) -> np.ndarray:
        if librosa is None:
            raise RuntimeError("librosa is not available")
        S = librosa.feature.melspectrogram(y=y, sr=self.sr, n_fft=self.n_fft, hop_length=self.hop_length)
        return np.mean(S, axis=0)

    async def extract_all_features(self, audio_path: str) -> AudioFeatures:
        if librosa is None:
            raise RuntimeError("librosa is not available")
        y, sr = await self.load_audio(audio_path)
        energy = self._compute_energy(y)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, hop_length=self.hop_length)
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=self.hop_length)
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr, hop_length=self.hop_length)
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, hop_length=self.hop_length)
        zero_crossing_rate = librosa.feature.zero_crossing_rate(y=y, hop_length=self.hop_length)
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, hop_length=self.hop_length)
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=self.hop_length)
        beat_times = librosa.frames_to_time(beats, sr=sr, hop_length=self.hop_length)

        return AudioFeatures(
            duration=len(y) / sr,
            sample_rate=sr,
            energy=energy,
            mfcc=mfcc,
            spectral_centroid=spectral_centroid,
            spectral_bandwidth=spectral_bandwidth,
            spectral_rolloff=spectral_rolloff,
            zero_crossing_rate=zero_crossing_rate,
            chroma=chroma,
            tempo=float(cast(Any, tempo) if np.isscalar(tempo) else cast(Any, tempo)[0]),
            beats=beat_times,
        )

    async def detect_silence(self, audio_path: str, threshold_db: float = -40, min_duration: float = 0.5) -> List[SilenceSegment]:
        from services.audio.processing_impl import detect_silence
        return await detect_silence(self, audio_path, threshold_db=threshold_db, min_duration=min_duration)

    async def segment_by_energy(self, audio_path: str, num_segments: int = 10, energy_threshold: Optional[float] = None) -> List[EnergySegment]:
        from services.audio.processing_impl import segment_by_energy
        return await segment_by_energy(self, audio_path, num_segments=num_segments, energy_threshold=energy_threshold)

    async def extract_summary_stats(self, audio_path: str) -> Dict[str, Any]:
        from services.audio.processing_impl import extract_summary_stats
        return await extract_summary_stats(self, audio_path)

    async def save_audio_segment(self, audio_path: str, start_time: float, end_time: float, output_path: str) -> str:
        from services.audio.processing_impl import save_audio_segment
        return await save_audio_segment(self, audio_path, start_time, end_time, output_path)


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
