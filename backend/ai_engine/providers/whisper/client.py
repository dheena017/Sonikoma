"""
backend/app/providers/whisper/client.py
─────────────────────────────────────────────────────────────────────────────
Lightweight client wrapper for Whisper speech-to-text inference.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Any, Optional, Union
from ai_engine.providers.whisper.types import WhisperModel

logger = logging.getLogger("sonikoma.providers.whisper.client")

try:
    import whisper as whisper_lib  # type: ignore[import-not-found]
    WHISPER_AVAILABLE = True
except ImportError:
    whisper_lib = None  # type: ignore[assignment]
    WHISPER_AVAILABLE = False


class WhisperClient:
    """Lightweight wrapper for direct Whisper model transcription calls."""

    @staticmethod
    def is_available() -> bool:
        return WHISPER_AVAILABLE and whisper_lib is not None

    @classmethod
    def transcribe(
        cls,
        audio_path: str,
        model: Union[WhisperModel, str] = WhisperModel.BASE,
        **kwargs: Any
    ) -> Any:
        """Transcribe an audio file using the specified model size."""
        if not cls.is_available():
            raise RuntimeError(
                "openai-whisper package is not installed. Install with: pip install openai-whisper"
            )
        model_name = model.value if isinstance(model, WhisperModel) else str(model)
        loaded = whisper_lib.load_model(model_name)
        return loaded.transcribe(audio_path, **kwargs)


# Alias for backward compatibility
WhisperProvider = WhisperClient
