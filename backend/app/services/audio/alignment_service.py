"""
backend/app/services/audio/alignment_service.py
─────────────────────────────────────────────────────────────────────────────
Service layer coordinating OCR/dialogue alignment, audio peak extraction,
Whisper transcribing, and Librosa analysis.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from typing import List, Dict, Any, Optional

from media.audio.dialogue_aligner import align_dialogue_and_extract_peaks
from engines.librosa.engine import get_librosa_engine
from engines.whisper.engine import get_whisper_engine, WhisperModel, WHISPER_AVAILABLE
import services.image.image_utils as img_utils

logger = logging.getLogger("sonikoma.services.audio.alignment_service")

try:
    librosa_engine = get_librosa_engine()
except ImportError as exc:
    logger.warning(f"Librosa engine disabled: {exc}")
    librosa_engine = None


def _ensure_librosa_engine() -> Any:
    if librosa_engine is None:
        raise ValueError("Librosa is not installed or available.")
    return librosa_engine


def _ensure_whisper_engine(model_name: WhisperModel, device: str = "cpu"):
    if not WHISPER_AVAILABLE:
        raise ValueError("Whisper is not installed or available.")
    try:
        return get_whisper_engine(model_name=model_name, device=device)
    except ImportError as exc:
        raise ValueError(str(exc))


async def align_dialogue_service(panel_id: str, audio_url: str, ocr_texts: List[str]) -> Dict[str, Any]:
    resolved = await img_utils.resolve_url_to_buffer(audio_url)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_in:
        tmp_in.write(resolved["data"])
        tmp_audio_path = tmp_in.name

    try:
        result = await align_dialogue_and_extract_peaks(
            audio_path=tmp_audio_path,
            ocr_texts=ocr_texts
        )
        return {
            "success": True,
            "panel_id": panel_id,
            **result
        }
    finally:
        try:
            if os.path.exists(tmp_audio_path):
                os.remove(tmp_audio_path)
        except OSError:
            pass


async def analyze_audio_service(audio_path: str) -> Dict[str, Any]:
    engine = _ensure_librosa_engine()
    stats = await engine.extract_summary_stats(audio_path)
    return stats


async def detect_silence_service(audio_path: str, threshold_db: float = -40.0, min_duration: float = 0.5) -> List[Dict[str, Any]]:
    engine = _ensure_librosa_engine()
    segments = await engine.detect_silence(audio_path, threshold_db=threshold_db, min_duration=min_duration)
    return [s.__dict__ for s in segments]


async def segment_by_energy_service(audio_path: str, num_segments: int = 10, energy_threshold: Optional[float] = None) -> List[Dict[str, Any]]:
    engine = _ensure_librosa_engine()
    segments = await engine.segment_by_energy(audio_path, num_segments=num_segments, energy_threshold=energy_threshold)
    return [s.__dict__ for s in segments]


async def load_audio_service(audio_path: str) -> Dict[str, Any]:
    engine = _ensure_librosa_engine()
    y, sr = await engine.load_audio(audio_path)
    return {"duration_seconds": len(y) / sr, "sample_rate": sr, "samples": len(y)}


async def transcribe_audio_service(
    audio_path: str,
    model_name: WhisperModel,
    language: Optional[str] = None,
    task: Optional[str] = None,
    verbose: bool = False
) -> Dict[str, Any]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    result = await engine.transcribe(audio_path, language=language, task=task, verbose=verbose)
    return {
        "text": result.text,
        "language": result.language,
        "duration": result.duration,
        "confidence": result.confidence,
        "segments": [s.__dict__ for s in result.segments],
    }


async def generate_srt_service(audio_path: str, output_path: str, model_name: WhisperModel, language: Optional[str] = None) -> str:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    result_path = await engine.generate_srt(audio_path, output_path, language=language)
    return result_path


async def generate_vtt_service(audio_path: str, output_path: str, model_name: WhisperModel, language: Optional[str] = None) -> str:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    result_path = await engine.generate_vtt(audio_path, output_path, language=language)
    return result_path


async def extract_words_service(audio_path: str, model_name: WhisperModel, language: Optional[str] = None) -> List[Dict[str, Any]]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    words = await engine.extract_words_with_timestamps(audio_path, language=language)
    return words


async def batch_transcribe_service(audio_paths: List[str], model_name: WhisperModel, language: Optional[str] = None) -> List[Optional[Dict[str, Any]]]:
    engine = _ensure_whisper_engine(model_name, device="cpu")
    results = await engine.batch_transcribe(audio_paths, language=language)
    return [r.__dict__ if r else None for r in results]
