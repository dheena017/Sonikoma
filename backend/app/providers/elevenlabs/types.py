"""
backend/app/providers/elevenlabs/types.py
─────────────────────────────────────────────────────────────────────────────
Type contracts, models enum, voice archetypes, and voice settings for ElevenLabs.
─────────────────────────────────────────────────────────────────────────────
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict


class ElevenLabsModel(str, Enum):
    """Supported ElevenLabs synthesis models."""
    MULTILINGUAL_V2 = "eleven_multilingual_v2"
    TURBO_V2 = "eleven_turbo_v2"
    MONOLINGUAL_V1 = "eleven_monolingual_v1"


@dataclass
class VoiceSettings:
    """Voice tuning and similarity modulation settings."""
    stability: float = 0.5
    similarity_boost: float = 0.75
    style: float = 0.0
    use_speaker_boost: bool = True


DEFAULT_ELEVENLABS_VOICES: Dict[str, str] = {
    "rachel": "21m00Tcm4TlvDq8ikWAM",
    "domi": "AZnzlk1XvdvUeBnXmlld",
    "bella": "EXAVITQu4vr4xnSDxMaL",
    "antoni": "ErXwobaYiN019PkySvjV",
    "elli": "MF3mGyEYCl7XYWbV9V6O",
    "josh": "TxGEqnHWrfWFTfGW9XjX",
    "arnold": "VR6AewLTigWG4xSOukaG",
    "adam": "pNInz6obpgDQGcFmaJgB",
    "sam": "yoZ06aMxZJJ28mfd3POQ",
}
