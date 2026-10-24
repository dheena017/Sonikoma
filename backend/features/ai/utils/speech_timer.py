"""
backend/features/ai/utils/speech_timer.py
─────────────────────────────────────────────────────────────────────────────
Calculates spoken audio seconds from text and words-per-minute rate.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Union


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _count_words(text: str) -> int:
    """Counts clean whitespace-separated words."""
    if not text or not text.strip():
        return 0
    return len(text.strip().split())


def _calculate_duration(word_count: int, words_per_minute: int) -> float:
    """Calculates speech seconds with a natural baseline pause for short sentences."""
    if word_count == 0:
        return 0.0
    wpm = max(60, min(300, words_per_minute))
    # Standard formula: words / (wpm / 60) + 0.8s breathing room
    seconds = (word_count / (wpm / 60.0)) + 0.8
    return round(max(1.5, seconds), 1)


# ── Public API ───────────────────────────────────────────────────────────────

def count_speech_seconds(text: str, words_per_minute: int = 145) -> float:
    """Calculates how many seconds speech will take based on words and talking speed."""
    words = _count_words(text)
    return _calculate_duration(words, words_per_minute)


__all__ = ["count_speech_seconds"]
