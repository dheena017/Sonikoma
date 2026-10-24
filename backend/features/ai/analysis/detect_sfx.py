"""
backend/features/ai/analysis/detect_sfx.py
─────────────────────────────────────────────────────────────────────────────
Finds comic sound effect words like BAM, SLASH, DODODO and picks audio tags.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import Dict, Any


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _clean_sfx_word(word: str) -> str:
    """Strips brackets, asterisks, and numbers from SFX text."""
    clean = re.sub(r"[\[\]\(\)\*0-9]", "", word).strip()
    return clean.upper()


# ── Public API ───────────────────────────────────────────────────────────────

def find_sound_effects(
    sound_word: str,
    genre: str = "action"
) -> Dict[str, Any]:
    """Matches a comic sound effect word to a digital audio library category."""
    if not sound_word or not sound_word.strip():
        return {"has_sfx": False, "category": "none", "sfx_word": ""}

    cleaned = _clean_sfx_word(sound_word)
    category = "impact"

    if any(w in cleaned for w in ["SLASH", "SWORD", "CUT", "SLICE"]):
        category = "blade_slash"
    elif any(w in cleaned for w in ["BOOM", "EXPLODE", "BLAST", "BANG"]):
        category = "explosion"
    elif any(w in cleaned for w in ["WHOOSH", "ZOOM", "SWISH", "DODGE"]):
        category = "wind_whoosh"
    elif any(w in cleaned for w in ["THUD", "PUNCH", "HIT", "CRACK"]):
        category = "physical_impact"
    elif any(w in cleaned for w in ["DODO", "RUMBLE", "SHAKE", "ZAZA"]):
        category = "earth_rumble"

    return {
        "has_sfx": True,
        "sfx_word": cleaned,
        "sound_word": cleaned,
        "category": category,
        "recommended_volume": 0.8
    }


__all__ = ["find_sound_effects"]
