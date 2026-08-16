"""
backend/app/services/audio/transcription/speech_transcriber.py
─────────────────────────────────────────────────────────────────────────────
Speech transcriber: Whisper SRT/VTT/JSON subtitle generation, word-level
timestamp extraction, and batch transcription.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
from typing import List, Optional, Dict, Any, Union

from app.providers.whisper.engine import TranscriptionResult, get_whisper_engine, WhisperModel, WHISPER_AVAILABLE

logger = logging.getLogger("sonikoma.services.audio.transcription.speech_transcriber")


def _ensure_whisper_engine(
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    device: str = "cpu"
):
    if not WHISPER_AVAILABLE:
        raise ValueError("Whisper is not installed or available.")
    selected_model: WhisperModel
    if isinstance(model_name, WhisperModel):
        selected_model = model_name
    elif isinstance(model_name, str):
        try:
            selected_model = WhisperModel(model_name.lower())
        except ValueError:
            selected_model = WhisperModel.BASE
    else:
        selected_model = WhisperModel.BASE

    try:
        return get_whisper_engine(model_name=selected_model, device=device)
    except ImportError as exc:
        raise ValueError(str(exc))


async def generate_srt(
    engine: Any,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None
) -> str:
    result = await engine.transcribe(audio_path, language=language)

    srt_lines = []
    for segment in result.segments:
        start_time = _format_srt_time(segment.start_time)
        end_time = _format_srt_time(segment.end_time)

        srt_lines.append(f"{segment.id + 1}")
        srt_lines.append(f"{start_time} --> {end_time}")
        srt_lines.append(segment.text)
        srt_lines.append("")

    srt_content = "\n".join(srt_lines)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(srt_content)

    logger.info(f"✓ SRT file generated: {output_path}")
    return output_path


async def generate_vtt(
    engine: Any,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None
) -> str:
    result = await engine.transcribe(audio_path, language=language)

    vtt_lines = ["WEBVTT", ""]

    for segment in result.segments:
        start_time = _format_vtt_time(segment.start_time)
        end_time = _format_vtt_time(segment.end_time)

        vtt_lines.append(f"{start_time} --> {end_time}")
        vtt_lines.append(segment.text)
        vtt_lines.append("")

    vtt_content = "\n".join(vtt_lines)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(vtt_content)

    logger.info(f"✓ VTT file generated: {output_path}")
    return output_path


async def extract_words_with_timestamps(
    engine: Any,
    audio_path: str,
    language: Optional[str] = None
) -> List[Dict[str, Any]]:
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
    engine: Any,
    audio_path: str,
    output_path: str,
    language: Optional[str] = None,
    include_words: bool = False
) -> str:
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

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(transcript_dict, f, indent=2, ensure_ascii=False)

    logger.info(f"✓ JSON transcript generated: {output_path}")
    return output_path


async def batch_transcribe(
    engine: Any,
    audio_paths: List[str],
    language: Optional[str] = None
) -> List[Optional[TranscriptionResult]]:
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


async def transcribe_audio_service(
    audio_path: str,
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    language: Optional[str] = None,
    task: Optional[str] = "transcribe",
    verbose: bool = False
) -> Dict[str, Any]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    result = await engine.transcribe(
        audio_path,
        language=language,
        task=task or "transcribe",
        verbose=verbose
    )
    return {
        "text": result.text,
        "language": result.language,
        "duration": result.duration,
        "confidence": result.confidence,
        "segments": [s.__dict__ for s in result.segments],
    }


async def generate_srt_service(
    audio_path: str,
    output_path: str,
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    language: Optional[str] = None
) -> str:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    return await generate_srt(engine, audio_path, output_path, language=language)


async def generate_vtt_service(
    audio_path: str,
    output_path: str,
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    language: Optional[str] = None
) -> str:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    return await generate_vtt(engine, audio_path, output_path, language=language)


async def extract_words_service(
    audio_path: str,
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    language: Optional[str] = None
) -> List[Dict[str, Any]]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    return await extract_words_with_timestamps(engine, audio_path, language=language)


async def batch_transcribe_service(
    audio_paths: List[str],
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    language: Optional[str] = None
) -> List[Optional[Dict[str, Any]]]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    results = await batch_transcribe(engine, audio_paths, language=language)
    return [r.__dict__ if r else None for r in results]


def _format_srt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def _format_vtt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


# Human-readable aliases
transcribe_audio_to_text = transcribe_audio_service
export_srt_subtitles = generate_srt_service
export_vtt_subtitles = generate_vtt_service
extract_timestamped_words = extract_words_service
