"""
backend/features/ai/analysis/detect_emotion.py
─────────────────────────────────────────────────────────────────────────────
Figures out dialogue emotion (whisper, calm, shout, panicked) and talking speed.
─────────────────────────────────────────────────────────────────────────────
"""

import re
from typing import Optional, Dict, Any


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _read_punctuation_marks(line: str) -> str:
    """Checks punctuation clues like exclamation marks, ellipsis, or caps."""
    clean = line.strip()
    if "!" in clean and clean.isupper() and len(clean) > 3:
        return "shouting"
    if clean.count("!") >= 2:
        return "shouting"
    if "..." in clean or "…" in clean:
        return "whisper"
    if "?" in clean and "!" in clean:
        return "panicked"
    return "neutral"


# ── Public API ───────────────────────────────────────────────────────────────

def find_emotion(
    speech_line: str,
    face_look: Optional[str] = None
) -> Dict[str, Any]:
    """Figures out the emotion (whisper, calm, shouting, tender, panicked) and speaking speed."""
    if not speech_line or not speech_line.strip():
        return {"emotion": "neutral", "speed_multiplier": 1.0}

    detected = _read_punctuation_marks(speech_line)
    if face_look:
        lower_face = face_look.lower()
        if any(w in lower_face for w in ["scream", "shout", "rage", "angry"]):
            detected = "shouting"
        elif any(w in lower_face for w in ["cry", "sad", "soft", "smile"]):
            detected = "tender"
        elif any(w in lower_face for w in ["scared", "fear", "panic"]):
            detected = "panicked"

    speed_map = {
        "shouting": 1.15,
        "panicked": 1.25,
        "whisper": 0.90,
        "tender": 0.95,
        "neutral": 1.00
    }

    return {
        "emotion": detected,
        "speed_multiplier": speed_map.get(detected, 1.0)
    }


__all__ = ["find_emotion"]
