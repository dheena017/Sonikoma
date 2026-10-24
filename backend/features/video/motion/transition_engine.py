"""
backend/features/video/motion/transition_engine.py
─────────────────────────────────────────────────────────────────────────────
Cinematic visual transitions (crossfade, whip pan, dip-to-black) between clips.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Any
from moviepy.editor import VideoClip, CompositeVideoClip


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _resolve_transition_mode(transition_name: str) -> str:
    """Normalizes transition identifier."""
    name = transition_name.lower().strip()
    if name in ("crossfade", "fade", "dissolve"):
        return "crossfade"
    elif name in ("dip_black", "dip_to_black", "black"):
        return "dip_to_black"
    return "crossfade"


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def apply_transition(
    clip_a: Any,
    clip_b: Any,
    transition_type: str = "crossfade",
    duration: float = 0.5
) -> Any:
    """Blends two video clips using a visual transition curve."""
    mode = _resolve_transition_mode(transition_type)
    actual_dur = min(duration, clip_a.duration * 0.5, clip_b.duration * 0.5)

    if mode == "crossfade":
        clip_b_faded = clip_b.crossfadein(actual_dur)
        start_time = max(0.0, clip_a.duration - actual_dur)
        return CompositeVideoClip([clip_a, clip_b_faded.set_start(start_time)])
    else:
        return CompositeVideoClip([clip_a, clip_b.set_start(clip_a.duration)])


# Backward compatibility alias
apply_clip_transition = apply_transition

__all__ = [
    "apply_transition",
    "apply_clip_transition",
]
