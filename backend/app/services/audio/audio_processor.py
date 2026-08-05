"""
backend/app/services/audio/audio_processor.py
─────────────────────────────────────────────────────────────────────────────
Audio signal processor: silence detection, energy segmentation, and Librosa
spectral feature extraction.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
import asyncio
from typing import List, Optional, Dict, Any
import numpy as np

try:
    import soundfile as sf
    import librosa
except ImportError:
    sf = None
    librosa = None

from engines.librosa.engine import SilenceSegment, EnergySegment, get_librosa_engine

logger = logging.getLogger("sonikoma.services.audio.audio_processor")


def _ensure_librosa_engine() -> Any:
    engine = get_librosa_engine()
    if engine is None:
        raise ValueError("Librosa is not installed or available.")
    return engine


async def detect_silence(
    engine: Any,
    audio_path: str,
    threshold_db: float = -40,
    min_duration: float = 0.5
) -> List[SilenceSegment]:
    y, sr = await engine.load_audio(audio_path)

    S = librosa.feature.melspectrogram(y=y, sr=sr)
    S_db = librosa.power_to_db(S, ref=np.max)
    energy_db = np.mean(S_db, axis=0)

    silence_frames = energy_db < threshold_db
    times = librosa.frames_to_time(np.arange(len(silence_frames)), sr=sr, hop_length=engine.hop_length)

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
    engine: Any,
    audio_path: str,
    num_segments: int = 10,
    energy_threshold: Optional[float] = None
) -> List[EnergySegment]:
    y, sr = await engine.load_audio(audio_path)
    energy = await asyncio.to_thread(engine._compute_energy, y)

    if energy_threshold is None:
        energy_threshold = np.mean(energy) * 0.5

    boundaries = np.where(np.diff(energy > energy_threshold) != 0)[0]

    segments = []
    prev_boundary = 0

    for i, boundary in enumerate(boundaries[:num_segments]):
        start_frame = prev_boundary
        end_frame = boundary
        start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=engine.hop_length)
        end_time = librosa.frames_to_time(end_frame, sr=sr, hop_length=engine.hop_length)
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

    if len(segments) < num_segments:
        start_frame = prev_boundary
        end_frame = len(energy)
        start_time = librosa.frames_to_time(start_frame, sr=sr, hop_length=engine.hop_length)
        end_time = librosa.frames_to_time(end_frame, sr=sr, hop_length=engine.hop_length)

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


async def extract_summary_stats(engine: Any, audio_path: str) -> Dict[str, Any]:
    features = await engine.extract_all_features(audio_path)

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
    engine: Any,
    audio_path: str,
    start_time: float,
    end_time: float,
    output_path: str
) -> str:
    y, sr = await engine.load_audio(audio_path)
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)
    segment = y[start_sample:end_sample]

    await asyncio.to_thread(sf.write, output_path, segment, sr)
    logger.info(f"✓ Saved audio segment: {output_path} ({end_time - start_time:.2f}s)")
    return output_path


async def analyze_audio_service(audio_path: str) -> Dict[str, Any]:
    engine = _ensure_librosa_engine()
    return await extract_summary_stats(engine, audio_path)


async def detect_silence_service(audio_path: str, threshold_db: float = -40.0, min_duration: float = 0.5) -> List[Dict[str, Any]]:
    engine = _ensure_librosa_engine()
    segments = await detect_silence(engine, audio_path, threshold_db=threshold_db, min_duration=min_duration)
    return [s.__dict__ for s in segments]


async def segment_by_energy_service(audio_path: str, num_segments: int = 10, energy_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
    engine = _ensure_librosa_engine()
    segments = await segment_by_energy(engine, audio_path, num_segments=num_segments, energy_threshold=energy_threshold)
    return [s.__dict__ for s in segments]


async def load_audio_service(audio_path: str) -> Dict[str, Any]:
    engine = _ensure_librosa_engine()
    y, sr = await engine.load_audio(audio_path)
    return {"duration_seconds": len(y) / sr, "sample_rate": sr, "samples": len(y)}


# Human-readable aliases
detect_audio_silence_segments = detect_silence_service
segment_audio_by_energy_peaks = segment_by_energy_service
analyze_audio_spectral_stats = analyze_audio_service

