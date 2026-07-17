"""
backend/app/services/audio/providers/whisper_provider.py
─────────────────────────────────────────────────────────────────────────────
Wrapper interface for OpenAI Whisper speech-to-text library.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.audio.providers.whisper")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    whisper = None
    WHISPER_AVAILABLE = False


class WhisperProvider:
    """Provider interface for OpenAI Whisper model loader and transcriber."""

    def __init__(self):
        if not WHISPER_AVAILABLE:
            logger.warning("openai-whisper is not installed. Whisper translation will fail.")

    @staticmethod
    def load_model(model_name: str, device: str = "cpu") -> Any:
        """Loads a Whisper model dynamically."""
        if not WHISPER_AVAILABLE:
            raise RuntimeError("openai-whisper library is not available.")
        return whisper.load_model(model_name, device=device)

    @staticmethod
    def transcribe(model: Any, audio_path: str, language: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Transcribes the given audio file using the loaded model."""
        if not WHISPER_AVAILABLE or model is None:
            raise RuntimeError("Whisper model is not loaded or library is not available.")
        
        options = {}
        if language:
            options["language"] = language
        options.update(kwargs)
        
        return model.transcribe(audio_path, **options)
