"""
backend/app/providers/librosa/engine.py
─────────────────────────────────────────────────────────────────────────────
Audio feature extraction and acoustic analysis engine using Librosa.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import asyncio
from typing import Tuple, Optional, Dict, Any, List, cast
import numpy as np

from ai_engine.providers.librosa.types import AudioFeatures, SilenceSegment, EnergySegment

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    librosa = None
    sf = None
    LIBROSA_AVAILABLE = False

logger = logging.getLogger("sonikoma.providers.librosa.engine")


class LibrosaEngine:
    def __init__(self, sr: int = 22050):
        if not LIBROSA_AVAILABLE:
            raise RuntimeError(
                "librosa and soundfile required. Install with: pip install librosa soundfile"
            )

        self.sr = sr
        self.hop_length = 512
        self.n_fft = 2048

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
        from features.audio.analysis import find_silent_parts
        parts = find_silent_parts(audio_file=audio_path, min_silence_seconds=min_duration, silence_threshold_db=threshold_db)
        return [SilenceSegment(start_time=p["start_time"], end_time=p["end_time"], duration=p["duration"]) for p in parts]

    async def segment_by_energy(self, audio_path: str, num_segments: int = 10, energy_threshold: Optional[float] = None) -> List[EnergySegment]:
        from features.audio.analysis import split_audio_by_energy
        pieces = split_audio_by_energy(audio_file=audio_path, max_pieces=num_segments, energy_threshold=energy_threshold)
        return [EnergySegment(start_time=p["start_time"], end_time=p["end_time"], duration=p["duration"], avg_energy=p.get("avg_energy", 0.0), is_peak=p.get("is_peak", False)) for p in pieces]

    async def extract_summary_stats(self, audio_path: str) -> Dict[str, Any]:
        from features.audio.analysis import check_sound_details
        return check_sound_details(audio_file=audio_path)

    async def save_audio_segment(self, audio_path: str, start_time: float, end_time: float, output_path: str) -> str:
        from features.audio.analysis import cut_audio_clip
        return cut_audio_clip(audio_file=audio_path, start_second=start_time, end_second=end_time, output_file=output_path)


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
