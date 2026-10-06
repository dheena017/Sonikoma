"""
backend/app/providers/elevenlabs/client.py
─────────────────────────────────────────────────────────────────────────────
ElevenLabs Voice AI Provider Client:
- Studio character voice generation & Multilingual v2 model support
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Optional, Any, Union
import httpx

from ai_engine.providers.elevenlabs.types import (
    ElevenLabsModel,
    VoiceSettings,
    DEFAULT_ELEVENLABS_VOICES,
)
from ai_engine.providers.elevenlabs.helpers import resolve_voice_id, build_tts_payload

logger = logging.getLogger("sonikoma.providers.elevenlabs.client")


class ElevenLabsClient:
    """Wrapper provider client for ElevenLabs Voice AI speech synthesis."""

    BASE_URL = "https://api.elevenlabs.io/v1"

    @classmethod
    def get_api_key(cls, override_key: Optional[str] = None) -> Optional[str]:
        return override_key or os.getenv("ELEVENLABS_API_KEY", "").strip() or None

    @classmethod
    async def synthesize_speech(
        cls,
        text: str,
        voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Rachel default
        model_id: Union[ElevenLabsModel, str] = ElevenLabsModel.MULTILINGUAL_V2,
        settings: Optional[VoiceSettings] = None,
        api_key: Optional[str] = None,
    ) -> Optional[bytes]:
        """Synthesize text via ElevenLabs REST API."""
        key = cls.get_api_key(api_key)
        if not key:
            logger.warning("[ElevenLabsClient] No ELEVENLABS_API_KEY configured.")
            return None

        actual_voice_id = resolve_voice_id(voice_id)
        model_str = model_id.value if isinstance(model_id, ElevenLabsModel) else str(model_id)

        url = f"{cls.BASE_URL}/text-to-speech/{actual_voice_id}"
        headers = {
            "xi-api-key": key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = build_tts_payload(text, model_id=model_str, settings=settings)

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    return resp.content
                else:
                    logger.warning(f"[ElevenLabsClient] Synthesis failed ({resp.status_code}): {resp.text[:120]}")
                    return None
        except Exception as exc:
            logger.error(f"[ElevenLabsClient] Network exception: {exc}")
            return None


# Backward compatibility alias
ElevenLabsProvider = ElevenLabsClient
