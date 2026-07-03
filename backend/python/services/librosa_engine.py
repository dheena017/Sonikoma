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

import os
import logging
import asyncio
from typing import Dict, Any, List, Tuple, Optional
from dataclasses import dataclass
import numpy as np

try:
    import librosa
    import soundfile as sf
except ImportError:
    raise ImportError("librosa and soundfile required. Install with: pip install librosa soundfile")

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

    async def detect_silence(
        self,
        audio_path: str,
        threshold_db: float = -40,
        min_duration: float = 0.5
    ) -> List[SilenceSegment]:
        """
        Detect silence segments in audio.

        Args:
            audio_path: Path to audio file
            threshold_db: Silence threshold in dB
            min_duration: Minimum silence duration (seconds)

        Returns:
            List of silence segments
        """
        y, sr = await self.load_audio(audio_path)

        # Convert to dB
        S = librosa.feature.melspectrogram(y=y, sr=sr)
        S_db = librosa.power_to_db(S, ref=np.max)

        # Mean energy across frequencies
        energy_db = np.mean(S_db, axis=0)

        # Detect silence frames
        silence_frames = energy_db < threshold_db

        # Convert frames to time
        times = librosa.frames_to_time(np.arange(len(silence_frames)), sr=sr, hop_length=self.hop_length)

        # Merge consecutive silence frames
        segments = []
        in_silence = False
        start_time = 0

        for i, (time, is_silent) in enumerate(zip(times, silence_frames)):
            if is_silent and not in_silence:
                start_time = time
                in_silence = True
            elif not is_silent and in_silence:
                duration = time - start_time
                if duration >= min_duration:
                    segments.append(SilenceSegment(
                        start_time=start_time,
                        end_time=time,
                        duration=duration,
                        threshold_db=threshold_db
                    ))
                in_silence = False

        logger.info(f"✓ Detected {len(segments)} silence segments")
        return segments

    async def segment_by_energy(
        self,
        audio_path: str,
        num_segments: int = 10,
        energy_threshold: Optional[float] = None
    ) -> List[EnergySegment]:
        """
        Segment audio based on energy levels.

        Args:
            audio_path: Path to audio file
            num_segments: Maximum number of segments to create
            energy_threshold: Custom energy threshold (None = auto)

        Returns:
            List of energy segments
        """
        y, sr = await self.load_audio(audio_path)

        # Compute energy
        energy = await asyncio.to_thread(self._compute_energy, y)

        if energy_threshold is None:
            energy_threshold = np.mean(energy) * 0.5

        # Detect segment boundaries
        boundaries = np.where(np.diff(energy > energy_threshold) != 0)[0]

        segments = []
        prev_boundary = 0

        for i, boundary in enumerate(boundaries[:num_segments]):
            start_frame = prev_boundary
            end_frame = boundary
            start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=self.hop_length)
            end_time = librosa.frames_to_time(end_frame, sr=sr, hop_length=self.hop_length)
            mean_energy = np.mean(energy[start_frame:end_frame])

            segments.append(EnergySegment(
                segment_id=i,
                start_frame=int(start_frame),
                end_frame=int(end_frame),
                start_time=float(start_time),
                end_time=float(end_time),
                duration=float(end_time - start_time),
                mean_energy=float(mean_energy)
            ))

            prev_boundary = boundary

        # Add final segment
        if len(segments) < num_segments:
            start_frame = prev_boundary
            end_frame = len(energy)
            start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=self.hop_length)
            end_time = librosa.frames_to_time(end_frame, sr=sr, hop_length=self.hop_length)

            segments.append(EnergySegment(
                segment_id=len(segments),
                start_frame=int(start_frame),
                end_frame=int(end_frame),
                start_time=float(start_time),
                end_time=float(end_time),
                duration=float(end_time - start_time),
                mean_energy=float(np.mean(energy[start_frame:end_frame]))
            ))

        logger.info(f"✓ Created {len(segments)} energy segments")
        return segments

    async def extract_summary_stats(self, audio_path: str) -> Dict[str, Any]:
        """
        Extract summary statistics for audio.

        Args:
            audio_path: Path to audio file

        Returns:
            Dictionary of audio statistics
        """
        features = await self.extract_all_features(audio_path)

        return {
            "duration_s": features.duration,
            "sample_rate": features.sample_rate,
            "tempo_bpm": features.tempo,
            "energy": {
                "mean": float(np.mean(features.energy)),
                "std": float(np.std(features.energy)),
                "min": float(np.min(features.energy)),
                "max": float(np.max(features.energy)),
            },
            "spectral_centroid": {
                "mean_hz": float(np.mean(features.spectral_centroid)),
                "std_hz": float(np.std(features.spectral_centroid)),
            },
            "spectral_bandwidth": {
                "mean_hz": float(np.mean(features.spectral_bandwidth)),
                "std_hz": float(np.std(features.spectral_bandwidth)),
            },
            "zero_crossing_rate": {
                "mean": float(np.mean(features.zero_crossing_rate)),
                "std": float(np.std(features.zero_crossing_rate)),
            },
            "num_beats": len(features.beats),
            "beat_times_s": [float(b) for b in features.beats],
        }

    async def save_audio_segment(
        self,
        audio_path: str,
        start_time: float,
        end_time: float,
        output_path: str
    ) -> str:
        """
        Extract and save audio segment.

        Args:
            audio_path: Source audio path
            start_time: Start time in seconds
            end_time: End time in seconds
            output_path: Output file path

        Returns:
            Path to saved segment
        """
        y, sr = await self.load_audio(audio_path)

        # Convert times to samples
        start_sample = int(start_time * sr)
        end_sample = int(end_time * sr)

        # Extract segment
        segment = y[start_sample:end_sample]

        # Save
        await asyncio.to_thread(sf.write, output_path, segment, sr)

        logger.info(f"✓ Saved audio segment: {output_path} ({end_time - start_time:.2f}s)")
        return output_path


# Singleton instance
_librosa_instance: Optional[LibrosaEngine] = None


def get_librosa_engine(sr: int = 22050) -> LibrosaEngine:
    """Get or create Librosa engine singleton."""
    global _librosa_instance
    if _librosa_instance is None:
        _librosa_instance = LibrosaEngine(sr=sr)
    return _librosa_instance
