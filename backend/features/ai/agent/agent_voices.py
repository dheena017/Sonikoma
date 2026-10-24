"""
Agent voice assignment engine.

Assigns consistent, high-quality AI voices to characters based on gender,
archetype, and role to preserve continuity across panels.
"""

from typing import List, Dict, Any, Optional
from features.creative.agent.cast_manager import SERIOUS_VOICE_PROFILES, CharacterCastManager


def _match_voice_by_gender(gender: str, language: str = "en") -> str:
    """Matches character gender to a suitable neural TTS voice."""
    lang = (language or "en")[:2].lower()
    profiles = SERIOUS_VOICE_PROFILES.get(lang, SERIOUS_VOICE_PROFILES["en"])

    gen = (gender or "").lower().strip()
    if gen in ("female", "f", "woman", "girl"):
        return profiles.get("female_lead", profiles["narrator"])
    elif gen in ("male", "m", "man", "boy"):
        return profiles.get("protagonist", profiles["narrator"])
    elif "mentor" in gen or "elder" in gen or "old" in gen:
        return profiles.get("mentor", profiles["narrator"])
    elif "villain" in gen or "demon" in gen or "monster" in gen:
        return profiles.get("antagonist", profiles["narrator"])
    return profiles.get("narrator", "en-US-ChristopherNeural")


def assign_voices(
    characters: List[Dict[str, Any]],
    default_voice: str = "en-US-ChristopherNeural",
    user_choices: Optional[Dict[str, str]] = None
) -> List[Dict[str, Any]]:
    """Assigns an AI speaking voice to each character so they always sound the same."""
    user_picks = user_choices or {}
    voice_cast = []

    for char in characters:
        name = char.get("name") or "Narrator"
        gender = char.get("gender") or "male"
        role = char.get("role") or "supporting"

        if name in user_picks:
            assigned = user_picks[name]
        elif name.lower() == "narrator":
            assigned = default_voice
        else:
            assigned = _match_voice_by_gender(gender)

        voice_cast.append({
            "character_name": name,
            "voice_id": assigned,
            "gender": gender,
            "role": role,
            "tone": "cinematic"
        })

    return voice_cast


__all__ = ["assign_voices"]
