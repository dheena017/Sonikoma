"""
backend/app/providers/edge_tts/engine.py
─────────────────────────────────────────────────────────────────────────────
Microsoft Edge Neural TTS speech synthesis execution engine.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import Dict, Any, Optional, List
from app.providers.edge_tts.client import EdgeTTSClient
from app.providers.edge_tts.types import DEFAULT_VOICES

logger = logging.getLogger("sonikoma.providers.edge_tts.engine")


class EdgeTTSEngine:
    """High-level speech synthesis engine coordinating character dialogue audio."""

    def __init__(self, voice_map: Optional[Dict[str, str]] = None):
        self.voice_map = voice_map or DEFAULT_VOICES

    def resolve_character_voice(self, character_role: str) -> str:
        """Resolve a character role (e.g. 'mentor', 'anime_male') to an Edge-TTS voice."""
        clean_role = character_role.lower().strip()
        return self.voice_map.get(clean_role, self.voice_map.get("protagonist_male", "en-US-ChristopherNeural"))

    async def synthesize_dialogue(
        self,
        text: str,
        character_role: str = "protagonist_male",
        output_path: Optional[str] = None,
        rate: str = "+0%",
        pitch: str = "+0Hz",
    ) -> Optional[bytes]:
        """Synthesize dialogue line using the character's mapped voice."""
        voice = self.resolve_character_voice(character_role)
        return await EdgeTTSClient.synthesize(
            text=text,
            voice=voice,
            output_path=output_path,
            rate=rate,
            pitch=pitch,
        )


_edge_tts_engine_instance: Optional[EdgeTTSEngine] = None


def get_edge_tts_engine(voice_map: Optional[Dict[str, str]] = None) -> EdgeTTSEngine:
    global _edge_tts_engine_instance
    if _edge_tts_engine_instance is None or voice_map:
        _edge_tts_engine_instance = EdgeTTSEngine(voice_map=voice_map)
    return _edge_tts_engine_instance
