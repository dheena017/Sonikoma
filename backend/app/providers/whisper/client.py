"""
backend/app/providers/whisper/client.py
Wrapper for Whisper provider (moved from providers/ai/whisper.py).
"""

import logging
from typing import Any, Optional

logger = logging.getLogger("sonikoma.providers.whisper")

try:
    import whisper as whisper_lib
    WHISPER_AVAILABLE = True
except Exception:
    whisper_lib = None
    WHISPER_AVAILABLE = False


class WhisperProvider:
    @staticmethod
    def transcribe(audio_path: str, model: str = "base") -> Any:
        if not WHISPER_AVAILABLE:
            raise RuntimeError("whisper package is not installed")
        model_inst = whisper_lib.load_model(model)
        return model_inst.transcribe(audio_path)
