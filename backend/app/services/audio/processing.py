import logging
import asyncio
from typing import List, Optional
from typing import Dict, Any
import numpy as np

try:
    import soundfile as sf
    import librosa
except ImportError:
    sf = None
    librosa = None

from engines.librosa import SilenceSegment, EnergySegment

logger = logging.getLogger("sonikoma.services.audio")

VOICE_MAP = {
    "Standard Comic Narrator (Male)": "en-US-GuyNeural",
    "Sultry Narrative Tone (Female)": "en-US-JennyNeural",
    "Shonen Protagonist (Energetic Male)": "en-US-JasonNeural",
    "Dark Anti-Hero voice (Raspy Deep)": "en-US-TonyNeural",
    
    # Curated voice labels using EM-dashes
    "English (US) — Guy (Male)": "en-US-GuyNeural",
    "English (US) — Jenny (Female)": "en-US-JennyNeural",
    "English (US) — Aria (Female)": "en-US-AriaNeural",
    "English (UK) — Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) — Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) — Natasha (Female)": "en-AU-NatashaNeural",
    "Korean — SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean — InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese — Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese (Mandarin) — Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) — Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) — Valluvar (Male)": "ta-IN-ValluvarNeural",

    # Curated voice labels using hyphens
    "English (US) - Guy (Male)": "en-US-GuyNeural",
    "English (US) - Jenny (Female)": "en-US-JennyNeural",
    "English (US) - Aria (Female)": "en-US-AriaNeural",
    "English (UK) - Sonia (Female)": "en-GB-SoniaNeural",
    "English (UK) - Ryan (Male)": "en-GB-RyanNeural",
    "English (AU) - Natasha (Female)": "en-AU-NatashaNeural",
    "Korean - SunHi (Female)": "ko-KR-SunHiNeural",
    "Korean - InJoon (Male)": "ko-KR-InJoonNeural",
    "Japanese - Nanami (Female)": "ja-JP-NanamiNeural",
    "Chinese (Mandarin) - Xiaoxiao (Female)": "zh-CN-XiaoxiaoNeural",
    "Tamil (India) - Pallavi (Female)": "ta-IN-PallaviNeural",
    "Tamil (India) - Valluvar (Male)": "ta-IN-ValluvarNeural"
}

# Minimum number of alphabetic characters required for TTS to produce audio
_TTS_MIN_ALPHA_CHARS = 3






if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Sonikoma TTS Audio Engine CLI")
    parser.add_argument("--dialogue_list", required=True, help="JSON list of dialogue strings")
    parser.add_argument("--target_duration", type=float, required=True, help="Target duration in seconds")
    parser.add_argument("--output_path", required=True, help="Path to save output MP3")
    parser.add_argument("--voice", default="en-US-GuyNeural", help="Edge-TTS voice code")

    args = parser.parse_args()


    asyncio.run(main())










async def detect_silence(
    engine,
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
    y, sr = await engine.load_audio(audio_path)

    # Convert to dB
    S = librosa.feature.melspectrogram(y=y, sr=sr)
    S_db = librosa.power_to_db(S, ref=np.max)

    # Mean energy across frequencies
    energy_db = np.mean(S_db, axis=0)

    # Detect silence frames
    silence_frames = energy_db < threshold_db

    # Convert frames to time
    times = librosa.frames_to_time(np.arange(len(silence_frames)), sr=sr, hop_length=engine.hop_length)

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
    engine,
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
    y, sr = await engine.load_audio(audio_path)

    # Compute energy
    energy = await asyncio.to_thread(engine._compute_energy, y)

    if energy_threshold is None:
        energy_threshold = np.mean(energy) * 0.5

    # Detect segment boundaries
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

    # Add final segment
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

async def extract_summary_stats(engine, audio_path: str) -> Dict[str, Any]:
    """
    Extract summary statistics for audio.

    Args:
        audio_path: Path to audio file

    Returns:
        Dictionary of audio statistics
    """
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
    engine,
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
    y, sr = await engine.load_audio(audio_path)

    # Convert times to samples
    start_sample = int(start_time * sr)
    end_sample = int(end_time * sr)

    # Extract segment
    segment = y[start_sample:end_sample]

    # Save
    await asyncio.to_thread(sf.write, output_path, segment, sr)

    logger.info(f"✓ Saved audio segment: {output_path} ({end_time - start_time:.2f}s)")
    return output_path
