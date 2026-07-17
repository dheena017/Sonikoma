import os
import re
import logging
import tempfile
import asyncio
from typing import List, Optional, Tuple
import edge_tts
from edge_tts.exceptions import NoAudioReceived
from pydub import AudioSegment
from pydub.effects import speedup
import json
from typing import Dict, Any
import numpy as np

try:
    import soundfile as sf
    import librosa
except ImportError:
    sf = None
    librosa = None

from .whisper_engine import TranscriptionResult, get_whisper_engine
from .librosa_engine import get_librosa_engine, SilenceSegment, EnergySegment, AudioFeatures

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

def sanitize_text_for_tts(text: str) -> str:
    """
    Cleans text before sending to edge-tts to prevent NoAudioReceived errors.
    - Strips control characters and null bytes
    - Collapses excessive whitespace
    - Removes SSML-unsafe characters
    """
    # Remove null bytes and control characters (except newline/tab)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # Normalize whitespace
    text = re.sub(r"[ \t]+", " ", text).strip()
    return text


async def generate_segment_with_retry(
    text: str,
    voice: str,
    temp_file_path: str,
    rate: Optional[str] = None,
    pitch: Optional[str] = None,
    max_retries: int = 3,
    base_delay: float = 1.0
) -> bool:
    """
    Attempts to generate a TTS audio segment with exponential backoff retries.

    Returns:
        True if audio was successfully saved, False if all retries were exhausted.
    """
    for attempt in range(1, max_retries + 1):
        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
            await communicate.save(temp_file_path)
            # Verify the file was actually written with content
            if os.path.exists(temp_file_path) and os.path.getsize(temp_file_path) > 0:
                return True
            logger.warning(f"[Narration/TTS] Attempt {attempt}: saved file is empty for text: '{text[:40]}'")
        except NoAudioReceived as e:
            logger.warning(
                f"[Narration/TTS] Attempt {attempt}/{max_retries}: NoAudioReceived for text: '{text[:40]}'. "
                f"Error: {e}"
            )
        except Exception as e:
            logger.warning(
                f"[Narration/TTS] Attempt {attempt}/{max_retries}: Unexpected error for text: '{text[:40]}'. "
                f"Error: {e}"
            )

        if attempt < max_retries:
            delay = base_delay * (2 ** (attempt - 1))
            logger.info(f"[Narration/TTS] Retrying in {delay:.1f}s...")
            await asyncio.sleep(delay)

    logger.error(f"[Narration/TTS] All {max_retries} attempts failed for text: '{text[:40]}'. Falling back to silence.")
    return False

async def generate_panel_audio(
    dialogue_list: List[str],
    target_duration: float,
    output_path: str,
    voice: Optional[str] = "en-US-GuyNeural",
    force_duration: bool = False,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
) -> Tuple[str, float]:
    """
    Generates dynamic text-to-speech elements for an ordered sequence of storyboard dialogue transcripts,
    concatenates all sentences into a coherent wave, and applies advanced pitch-preserved time-stretching or
    silence-padding mechanisms using pydub.

    Args:
        dialogue_list (List[str]): Extracted dialog items to encode.
        target_duration (float): Exact target duration of the audio in seconds.
        output_path (str): File path to save the completed MP3/WAV segment.
        voice (Optional[str]): Standard edge-tts voice code or friendly UI name.
        force_duration (bool): If True, audio will be stretched/padded to match target_duration exactly.
                               If False, audio will retain natural length (unless longer than target_duration).
        speech_rate (float): Vocal playback speed multiplier (default: 1.0).
        speech_pitch (float): Vocal pitch shift multiplier (default: 1.0).

    Returns:
        (str, float): Tuple of (Absolute destination path, Actual duration in seconds).
    """
    if not dialogue_list or all(not text.strip() for text in dialogue_list):
        # Gracefully generate complete ambient silence if there is no audio transcript specified
        logger.warning(f"Empty dialogue list encountered for output: {output_path}. Defaulting to pure silence card.")
        silence_segment = AudioSegment.silent(duration=int(target_duration * 1000))
        if os.path.dirname(output_path):
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
        silence_segment.export(output_path, format="mp3")
        logger.info(f"[Narration/TTS] Successfully generated {target_duration}s of silence.")
        return output_path, target_duration

    target_duration_ms = int(target_duration * 1000)
    temp_dir = tempfile.gettempdir()
    temp_files = []

    actual_voice = VOICE_MAP.get(voice, voice) if voice else "en-US-GuyNeural"
    if not actual_voice or "-" not in actual_voice or actual_voice.strip().lower() in ("undefined", "null", "default"):
        actual_voice = "en-US-GuyNeural"

    # Format speed/pitch as required by edge-tts (+10% / -5%)
    rate_percent = int((speech_rate - 1.0) * 100)
    rate_str = f"{rate_percent:+}%"
    pitch_percent = int((speech_pitch - 1.0) * 100)
    pitch_str = f"{pitch_percent:+}%"

    try:
        # Phase 1: Generate individual audio strips asynchronously
        for idx, text in enumerate(dialogue_list):
            if not text.strip():
                continue

            # Sanitize text to prevent edge-tts control character / whitespace errors
            text = sanitize_text_for_tts(text)

            # Escape or skip empty texts
            temp_file_path = os.path.join(temp_dir, f"dialog_segment_{uuid_hex()}_{idx}.mp3")
            temp_files.append(temp_file_path)

            if not any(c.isalnum() for c in text):
                logger.info(f"[Narration/TTS] Segment {idx+1}/{len(dialogue_list)}: '{text[:40]}' contains no spoken characters. Generating silence segment.")
                # Generate 1 second of silence as a placeholder for punctuation pauses
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            # Guard: edge-tts requires a minimum amount of speakable content
            alpha_count = sum(1 for c in text if c.isalpha())
            if alpha_count < _TTS_MIN_ALPHA_CHARS:
                logger.info(
                    f"[Narration/TTS] Segment {idx+1}/{len(dialogue_list)}: '{text[:40]}' has too few "
                    f"alphabetic characters ({alpha_count} < {_TTS_MIN_ALPHA_CHARS}). Using silence."
                )
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")
                continue

            logger.info(f"[Narration/TTS] Generating segment {idx+1}/{len(dialogue_list)}: '{text[:40]}...' using voice: {actual_voice} (rate={rate_str}, pitch={pitch_str})")
            success = await generate_segment_with_retry(text, actual_voice, temp_file_path, rate=rate_str, pitch=pitch_str)
            if not success:
                # Retry exhausted — substitute silence so pipeline continues
                silence_seg = AudioSegment.silent(duration=1000)
                silence_seg.export(temp_file_path, format="mp3")

        def process_audio_sync():
            # Phase 2: Loading & Concatenating files using defensive format normalizer
            combined_audio = AudioSegment.empty()
            for idx, file_path in enumerate(temp_files):
                if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                    continue

                segment = AudioSegment.from_file(file_path, format="mp3")
                # Normalize tracks sample rate & active channels to avoid standard concat glitches
                normalized_seg = segment.set_frame_rate(44100).set_channels(2)

                # If combining multiple segments, introduce a short natural 100ms pause, except for last
                combined_audio += normalized_seg
                if idx < len(temp_files) - 1:
                    combined_audio += AudioSegment.silent(duration=100)

            current_duration_ms = len(combined_audio)
            logger.info(f"Concat summary: initial raw voice length = {current_duration_ms}ms, target = {target_duration_ms}ms")

            # Phase 3: Alignment to target_duration
            if current_duration_ms == 0:
                logger.warning("Combined audio yielded zero duration. Exporting silence.")
                final_audio = AudioSegment.silent(duration=target_duration_ms)
            elif force_duration:
                if current_duration_ms > target_duration_ms and target_duration_ms > 0:
                    # Seamless speedup without pitch shifting using pydub.effects
                    playback_speed = float(current_duration_ms) / float(target_duration_ms)
                    logger.info(f"Action: Force duration enabled. Compressing with factor: {playback_speed:.2f}x")

                    if playback_speed > 1.0:
                        try:
                            final_audio = speedup(combined_audio, playback_speed=playback_speed)
                        except Exception as stretch_err:
                            logger.error(f"Pydub speedup failed, falling back to direct curtailing: {str(stretch_err)}")
                            final_audio = combined_audio
                    else:
                        final_audio = combined_audio
                    final_audio = final_audio[:target_duration_ms]
                else:
                    # Padding with tailing organic silence
                    silence_needed_ms = target_duration_ms - current_duration_ms
                    logger.info(f"Action: Force duration enabled. Appending {silence_needed_ms}ms of silence.")
                    silence_padding = AudioSegment.silent(duration=silence_needed_ms)
                    final_audio = combined_audio + silence_padding
                    final_audio = final_audio[:target_duration_ms]
            else:
                # Natural length logic:
                final_audio = combined_audio

            # Final measurement
            final_duration_ms = len(final_audio)

            # Phase 4: Export finished compilation stream
            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            final_audio.export(output_path, format="mp3")
            logger.info(f"Audio compilation saved successfully at: {output_path} with final length {final_duration_ms}ms")
            return final_duration_ms / 1000.0

        actual_duration = await asyncio.to_thread(process_audio_sync)
        return output_path, actual_duration

    except Exception as general_err:
        logger.error(f"Audio Engine pipeline failure: {str(general_err)}", exc_info=True)
        # Fallback safeguard: Output pure silence corresponding to expected duration so as to not break moviepy compiler
        try:
            if os.path.dirname(output_path):
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
            fallback_silence = AudioSegment.silent(duration=target_duration_ms)
            fallback_silence.export(output_path, format="mp3")
            logger.info(f"Safeguard silent master audio exported safely to: {output_path}")
            return output_path, target_duration
        except Exception as write_fallback_err:
            logger.critical(f"Fatal fallback sound export failure: {str(write_fallback_err)}")
            raise general_err
    finally:
        # Clean down any generated disk resources mapping temp MP3 files
        for f in temp_files:
            try:
                if os.path.exists(f):
                    os.remove(f)
            except Exception as rm_err:
                logger.debug(f"Failed clearing temporary fragment tracking block {f}: {str(rm_err)}")

def uuid_hex() -> str:
    import uuid
    return uuid.uuid4().hex[:8]

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="Sonikoma TTS Audio Engine CLI")
    parser.add_argument("--dialogue_list", required=True, help="JSON list of dialogue strings")
    parser.add_argument("--target_duration", type=float, required=True, help="Target duration in seconds")
    parser.add_argument("--output_path", required=True, help="Path to save output MP3")
    parser.add_argument("--voice", default="en-US-GuyNeural", help="Edge-TTS voice code")

    args = parser.parse_args()

    async def main():
        try:
            dialogue = json.loads(args.dialogue_list)
            path, dur = await generate_panel_audio(
                dialogue_list=dialogue,
                target_duration=args.target_duration,
                output_path=args.output_path,
                voice=args.voice
            )
            print(f"SUCCESS: {dur}")
        except Exception as e:
            import sys
            print(f"ERROR: {str(e)}", file=sys.stderr)
            sys.exit(1)

    asyncio.run(main())


async def generate_srt(
    engine,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None
) -> str:
    """
    Transcribe and generate SRT subtitle file.

    Args:
        audio_path: Path to audio file
        output_path: Path to save SRT file
        language: ISO language code

    Returns:
        Path to generated SRT file
    """
    result = await engine.transcribe(audio_path, language=language)

    # Generate SRT content
    srt_lines = []
    for segment in result.segments:
        start_time = _format_srt_time(segment.start_time)
        end_time = _format_srt_time(segment.end_time)

        srt_lines.append(f"{segment.id + 1}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(segment.text)
        srt_lines.append("")

    srt_content = "\n".join(srt_lines)

    # Write SRT file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    logger.info(f"✓ SRT file generated: {output_path}")
    return output_path

async def generate_vtt(
    engine,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None
) -> str:
    """
    Transcribe and generate WebVTT subtitle file.

    Args:
        audio_path: Path to audio file
        output_path: Path to save VTT file
        language: ISO language code

    Returns:
        Path to generated VTT file
    """
    result = await engine.transcribe(audio_path, language=language)

    # Generate VTT content
    vtt_lines = ["WEBVTT", ""]

    for segment in result.segments:
        start_time = _format_vtt_time(segment.start_time)
        end_time = _format_vtt_time(segment.end_time)

        vtt_lines.append(f"{start_time} --> {end_time}")
        vtt_lines.append(segment.text)
        vtt_lines.append("")

    vtt_content = "\n".join(vtt_lines)

    # Write VTT file
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(vtt_content)

    logger.info(f"✓ VTT file generated: {output_path}")
    return output_path

async def extract_words_with_timestamps(
    engine,
    audio_path: str,
    language: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Extract individual words with their timestamps and confidence.

    Args:
        audio_path: Path to audio file
        language: ISO language code

    Returns:
        List of word dictionaries with start, end, text, confidence
    """
    result = await engine.transcribe(audio_path, language=language)

    words = []
    word_id = 0

    for segment in result.segments:
        segment_words = segment.text.split()
        segment_duration = segment.end_time - segment.start_time
        word_duration = segment_duration / len(segment_words) if segment_words else 0

        for i, word in enumerate(segment_words):
            word_start = segment.start_time + (i * word_duration)
            word_end = word_start + word_duration

            words.append({
                "id": word_id,
                "text": word,
                "start_time": word_start,
                "end_time": word_end,
                "confidence": segment.confidence,
                "segment_id": segment.id
            })
            word_id += 1

    logger.info(f"✓ Extracted {len(words)} words with timestamps")
    return words

async def generate_json_transcript(
    engine,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None,
    include_words: bool = False
) -> str:
    """
    Generate JSON transcript file.

    Args:
        audio_path: Path to audio file
        output_path: Path to save JSON file
        language: ISO language code
        include_words: Include word-level timestamps

    Returns:
        Path to generated JSON file
    """
    result = await engine.transcribe(audio_path, language=language)

    transcript_dict = {
        "text": result.text,
        "language": result.language,
        "duration_s": result.duration,
        "confidence": result.confidence,
        "segments": [
            {
                "id": s.id,
                "start_s": s.start_time,
                "end_s": s.end_time,
                "text": s.text,
                "confidence": s.confidence
            }
            for s in result.segments
        ]
    }

    if include_words:
        words = await self.extract_words_with_timestamps(audio_path, language=language)
        transcript_dict["words"] = words

    # Write JSON file
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transcript_dict, f, indent=2, ensure_ascii=False)

    logger.info(f"✓ JSON transcript generated: {output_path}")
    return output_path

async def batch_transcribe(
    engine,
    audio_paths: List[str],
    language: Optional[str] = None
) -> List[TranscriptionResult]:
    """
    Transcribe multiple audio files.

    Args:
        audio_paths: List of audio file paths
        language: ISO language code

    Returns:
        List of transcription results
    """
    logger.info(f"Batch transcribing {len(audio_paths)} files...")

    results = []
    for i, audio_path in enumerate(audio_paths):
        logger.info(f"  [{i+1}/{len(audio_paths)}] {os.path.basename(audio_path)}")
        try:
            result = await engine.transcribe(audio_path, language=language)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to transcribe {audio_path}: {e}")
            results.append(None)

    successful = sum(1 for r in results if r is not None)
    logger.info(f"✓ Batch transcription complete: {successful}/{len(audio_paths)} successful")

    return results

def _format_srt_time(seconds: float) -> str:
    """Format time for SRT format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def _format_vtt_time(seconds: float) -> str:
    """Format time for VTT format (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


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
