"""
backend/features/ai/narrative/story_pacing.py
─────────────────────────────────────────────────────────────────────────────
Measures story speed, action peaks, and scene transitions across panels.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _score_excitement(panel: Dict[str, Any]) -> float:
    """Scores emotional and action intensity of a single panel from 0.0 to 1.0."""
    score = 0.5
    emotion = str(panel.get("emotion") or "").lower()
    sfx = str(panel.get("sfx") or "").strip()
    motion = str(panel.get("motion_type") or "").lower()

    if emotion in ("shouting", "panicked"):
        score += 0.25
    elif emotion == "whisper":
        score -= 0.15

    if sfx:
        score += 0.15

    if motion in ("zoom_in", "pan_up"):
        score += 0.10

    return max(0.1, min(1.0, round(score, 2)))


# ── Public API ───────────────────────────────────────────────────────────────

async def check_pacing(
    panels: List[Dict[str, Any]],
    genre: str = "Action Fantasy",
    ai_provider: str = "gemini",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Measures story speed, action peaks, and scene breaks across a comic chapter."""
    if not panels:
        return {"pacing": "balanced", "tension_curve": [], "average_intensity": 0.5}

    tension_curve = [_score_excitement(p) for p in panels]
    avg_tension = round(sum(tension_curve) / float(len(tension_curve)), 2)

    pacing_label = "fast_paced" if avg_tension > 0.65 else ("slow_atmospheric" if avg_tension < 0.4 else "balanced")

    return {
        "pacing": pacing_label,
        "genre": genre,
        "panel_count": len(panels),
        "tension_curve": tension_curve,
        "average_intensity": avg_tension
    }


__all__ = ["check_pacing"]
