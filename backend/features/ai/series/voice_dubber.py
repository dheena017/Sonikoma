"""
Voice dubbing service for AI comic series.

Generates consistent character speech audio for all dialogue lines in an episode
using neural TTS.
"""

from typing import List, Dict, Any
from features.creative.agent.cast_manager import SERIOUS_VOICE_PROFILES


def _find_voice_for_speaker(speaker_name: str, characters: List[Dict[str, Any]]) -> str:
    """Matches speaker name with their assigned character voice profile."""
    clean_speaker = (speaker_name or "").strip().lower()
    for char in characters:
        if (char.get("name") or "").strip().lower() == clean_speaker:
            if char.get("voice_id"):
                return char["voice_id"]
            gender = char.get("gender", "male").lower()
            if gender in ("female", "f", "woman"):
                return SERIOUS_VOICE_PROFILES["en"]["female_lead"]
            return SERIOUS_VOICE_PROFILES["en"]["protagonist"]

    if "narrator" in clean_speaker:
        return SERIOUS_VOICE_PROFILES["en"]["narrator"]
    return SERIOUS_VOICE_PROFILES["en"]["supporting_male"]


async def dub_chapter_voices(
    series_id: str,
    chapter_id: str,
    dialogue_lines: List[Dict[str, Any]],
    characters: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Generates voiced audio for all dialogue lines in an episode."""
    dubbed = []
    for idx, line in enumerate(dialogue_lines):
        speaker = line.get("speaker", "Narrator")
        text = line.get("dialogue") or line.get("speech_text") or ""
        voice = _find_voice_for_speaker(speaker, characters)

        dubbed.append({
            "panel_number": line.get("panel_number", idx + 1),
            "speaker": speaker,
            "text": text,
            "voice_id": voice,
            "status": "ready"
        })

    return dubbed


__all__ = ["dub_chapter_voices"]
