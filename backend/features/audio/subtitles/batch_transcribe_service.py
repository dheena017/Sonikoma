"""
backend/features/audio/subtitles/batch_transcribe_service.py
─────────────────────────────────────────────────────────────────────────────
Batch speech transcription: processes multiple audio files sequentially,
isolating individual errors so batch workflows complete reliably.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional, Union
from ai_engine.providers.whisper import WhisperModel
from features.audio.subtitles.speech_to_text_service import _start_speech_model

logger = logging.getLogger("sonikoma.audio.subtitles.batch")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

async def _transcribe_single_audio(
    speech_model: Any,
    path: str,
    language: Optional[str]
) -> Optional[Dict[str, Any]]:
    """Transcribes an individual audio file, capturing and logging any transient failure."""
    if not os.path.exists(path):
        logger.warning(f"Audio file does not exist: {path}")
        return None

    try:
        result = await speech_model.transcribe(path, language=language)
        return {
            "path": path,
            "text": result.text,
            "language": result.language,
            "duration": result.duration,
            "confidence": result.confidence,
            "segments": [s.__dict__ for s in result.segments],
        }
    except Exception as exc:
        logger.error(f"Failed to transcribe {path}: {exc}")
        return None


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def turn_many_files_into_text(
    audio_paths: List[str],
    model_name: Union[WhisperModel, str] = WhisperModel.BASE,
    language: Optional[str] = None
) -> List[Optional[Dict[str, Any]]]:
    """
    Transcribes a whole list of audio files into text one after another.
    """
    if not audio_paths:
        return []

    engine = _start_speech_model(model_name=model_name, device="cpu")
    results = []

    for idx, path in enumerate(audio_paths):
        logger.info(f"[{idx + 1}/{len(audio_paths)}] Transcribing: {os.path.basename(path)}")
        res = await _transcribe_single_audio(engine, path, language)
        results.append(res)

    successful = sum(1 for r in results if r is not None)
    logger.info(f"✓ Batch transcription complete: {successful}/{len(audio_paths)} succeeded")
    return results


__all__ = ["turn_many_files_into_text"]
