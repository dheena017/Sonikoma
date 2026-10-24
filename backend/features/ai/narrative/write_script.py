"""
backend/features/ai/narrative/write_script.py
─────────────────────────────────────────────────────────────────────────────
Turns comic panels and dialogue bubbles into an engaging spoken narrator script.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional
import re


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _clean_script_words(text: str) -> str:
    """Removes speaker name prefixes and cleans punctuation for smooth reading."""
    cleaned = re.sub(r'^(Narrator|Hero|Villain|\w+):\s*', '', text.strip(), flags=re.IGNORECASE)
    return cleaned.strip('"').strip("'").strip()


# ── Public API ───────────────────────────────────────────────────────────────

async def write_story_script(
    panels: List[Dict[str, Any]],
    voice_tone: str = "cinematic",
    ai_provider: str = "gemini",
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Creates a complete spoken voiceover script that matches each comic panel's visual action."""
    script_lines = []

    for idx, p in enumerate(panels):
        speech = str(p.get("speech_text") or "").strip()
        vis = str(p.get("visual_description") or "").strip()
        narrative = str(p.get("narrative") or "").strip()

        if narrative:
            spoken = _clean_script_words(narrative)
        elif speech:
            spoken = _clean_script_words(speech)
        else:
            spoken = f"The battle continues as the silence hangs heavy in the air."

        script_lines.append({
            "panel_index": idx,
            "spoken_line": spoken,
            "tone": voice_tone,
            "has_dialogue": bool(speech)
        })

    return script_lines


__all__ = ["write_story_script"]
