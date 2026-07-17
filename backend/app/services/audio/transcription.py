import os
import logging
import asyncio
from typing import List, Optional
import json
from typing import Dict, Any

try:
    import soundfile as sf
    import librosa
except ImportError:
    sf = None
    librosa = None

from engines.whisper import TranscriptionResult

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
    import json

    parser = argparse.ArgumentParser(description="Sonikoma TTS Audio Engine CLI")
    parser.add_argument("--dialogue_list", required=True, help="JSON list of dialogue strings")
    parser.add_argument("--target_duration", type=float, required=True, help="Target duration in seconds")
    parser.add_argument("--output_path", required=True, help="Path to save output MP3")
    parser.add_argument("--voice", default="en-US-GuyNeural", help="Edge-TTS voice code")

    args = parser.parse_args()


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
        words = await extract_words_with_timestamps(engine, audio_path, language=language)
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





