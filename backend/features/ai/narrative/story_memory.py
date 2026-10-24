"""
backend/features/ai/narrative/story_memory.py
─────────────────────────────────────────────────────────────────────────────
Remembers active characters, recent dialogue turns, and ongoing story events.
─────────────────────────────────────────────────────────────────────────────
"""

import time
from typing import Dict, Any, List, Optional


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _format_characters_text(roster: Dict[str, Any]) -> str:
    """Formats character names and genders into clean text."""
    parts = []
    for name, info in list(roster.items())[:8]:
        gender = info.get("gender", "unknown") if isinstance(info, dict) else "unknown"
        parts.append(f"{name} ({gender})")
    return ", ".join(parts)


# ── Public API ───────────────────────────────────────────────────────────────

def remember_story(
    old_memory: Dict[str, Any],
    panel_results: Dict[str, Any],
    panel_number: int
) -> Dict[str, Any]:
    """Updates ongoing story memory with who spoke, who appeared, and what just happened."""
    memory = dict(old_memory) if isinstance(old_memory, dict) else {}
    characters = dict(memory.get("characters", {}))
    dialogue_history = list(memory.get("dialogue_history", []))
    scene_history = list(memory.get("scene_history", []))
    current_scene = str(memory.get("current_scene", ""))

    speaker = str(panel_results.get("speaker_name") or "").strip()
    speech = str(panel_results.get("speech_text") or "").strip()
    gender = str(panel_results.get("speaker_gender") or "neutral").strip().lower()
    scene_notes = str(panel_results.get("visual_description") or "")

    if scene_notes:
        current_scene = scene_notes[:250]

    if speaker and speaker.lower() not in ("narrator", "none", "unknown", ""):
        if speaker not in characters:
            characters[speaker] = {
                "gender": gender,
                "first_seen_panel": panel_number
            }

    if speech:
        dialogue_history.append({
            "panel": panel_number,
            "speaker": speaker,
            "text": speech[:200]
        })
        if len(dialogue_history) > 6:
            dialogue_history.pop(0)

    return {
        "current_scene": current_scene,
        "characters": characters,
        "active_characters_text": _format_characters_text(characters),
        "dialogue_history": dialogue_history,
        "last_updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


__all__ = ["remember_story"]
