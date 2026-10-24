"""
backend/features/video/compiler/audio_sync_engine.py
─────────────────────────────────────────────────────────────────────────────
Audio-visual alignment, speech duration estimation, and waveform sync.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Dict, Any, Optional


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _estimate_reading_duration(text: str, wpm: int = 150) -> float:
    """Estimates baseline dialogue speech duration in seconds from word count."""
    if not text:
        return 3.0
    words = len(text.strip().split())
    return max(2.5, (words / wpm) * 60.0)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def sync_dialogue(
    speech_text: str,
    audio_duration: float,
    audio_peaks: Optional[List[float]] = None
) -> Dict[str, Any]:
    """Syncs speech text with audio duration and sound peaks."""
    effective_duration = max(audio_duration, _estimate_reading_duration(speech_text))
    peaks = audio_peaks or []

    action_cues = [p for p in peaks if 0.0 <= p <= effective_duration]

    return {
        "text": speech_text,
        "duration": effective_duration,
        "action_cues": action_cues,
        "has_audio_sync": audio_duration > 0.0,
    }


# Backward compatibility alias
align_dialogue_with_audio = sync_dialogue

__all__ = [
    "sync_dialogue",
    "align_dialogue_with_audio",
]
