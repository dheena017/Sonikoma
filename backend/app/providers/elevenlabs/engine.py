"""
backend/app/providers/elevenlabs/engine.py
─────────────────────────────────────────────────────────────────────────────
ElevenLabs Voice AI execution engine: studio speech synthesis runner.
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional, Union, Dict, Any
from app.providers.elevenlabs.client import ElevenLabsClient
from app.providers.elevenlabs.types import ElevenLabsModel, VoiceSettings, DEFAULT_ELEVENLABS_VOICES
from app.providers.elevenlabs.helpers import resolve_voice_id

logger = logging.getLogger("sonikoma.providers.elevenlabs.engine")


class ElevenLabsEngine:
    """Execution engine for studio-quality voice dubbing and character monologue synthesis."""

    def __init__(self, api_key: Optional[str] = None, default_model: Union[ElevenLabsModel, str] = ElevenLabsModel.MULTILINGUAL_V2):
        self.api_key = api_key
        self.default_model = default_model

    async def generate_speech(
        self,
        text: str,
        voice: str = "rachel",
        model: Optional[Union[ElevenLabsModel, str]] = None,
        stability: float = 0.5,
        similarity_boost: float = 0.75,
    ) -> Optional[bytes]:
        """Generate speech bytes with explicit stability and similarity tuning."""
        voice_id = resolve_voice_id(voice)
        target_model = model or self.default_model
        settings = VoiceSettings(stability=stability, similarity_boost=similarity_boost)

        return await ElevenLabsClient.synthesize_speech(
            text=text,
            voice_id=voice_id,
            model_id=target_model,
            settings=settings,
            api_key=self.api_key,
        )


_elevenlabs_engine_instance: Optional[ElevenLabsEngine] = None


def get_elevenlabs_engine(api_key: Optional[str] = None) -> ElevenLabsEngine:
    global _elevenlabs_engine_instance
    if _elevenlabs_engine_instance is None or api_key:
        _elevenlabs_engine_instance = ElevenLabsEngine(api_key=api_key)
    return _elevenlabs_engine_instance
