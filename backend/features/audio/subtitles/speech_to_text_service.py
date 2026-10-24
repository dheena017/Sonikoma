"""
backend/features/audio/subtitles/speech_to_text_service.py
─────────────────────────────────────────────────────────────────────────────
Speech-to-text recognition: listens to audio and generates clean text
transcripts with detected language and segment timestamps using OpenAI Whisper.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional, Union
from ai_engine.providers.whisper import (
    get_whisper_engine,
    WhisperModel,
    WHISPER_AVAILABLE,
)

logger = logging.getLogger("sonikoma.audio.subtitles.stt")


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _start_speech_model(
    model_name: Optional[Union[WhisperModel, str]] = WhisperModel.BASE,
    device: str = "cpu"
) -> Any:
    """Loads and returns the cached Whisper speech recognition model engine."""
    if not WHISPER_AVAILABLE:
        raise ValueError("OpenAI Whisper is not installed or available on this system.")

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

    return get_whisper_engine(model_name=selected_model, device=device)


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

async def turn_speech_into_text(
    audio_path: str,
    model_name: Union[WhisperModel, str] = WhisperModel.BASE,
    language: Optional[str] = None,
    task: str = "transcribe",
    verbose: bool = False
) -> Dict[str, Any]:
    """
    Listens to speech audio and writes out the words with timestamps.
    """
    engine = _start_speech_model(model_name=model_name, device="cpu")
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


__all__ = ["turn_speech_into_text"]
