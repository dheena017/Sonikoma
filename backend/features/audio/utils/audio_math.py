"""
backend/features/audio/utils/audio_math.py
─────────────────────────────────────────────────────────────────────────────
Simple mathematical conversions for volume gain, sample rates, frame counts,
and spoken duration estimation from text.
─────────────────────────────────────────────────────────────────────────────
"""

import math
import re


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def decibels_to_volume(db: float) -> float:
    """Converts a decibel gain value (e.g. -6 dB) to a linear volume multiplier (e.g. 0.5)."""
    return 10.0 ** (db / 20.0)


def volume_to_decibels(volume: float) -> float:
    """Converts a linear volume multiplier (e.g. 0.5) to decibel gain (e.g. -6.02 dB)."""
    if volume <= 0:
        return -100.0  # Mute
    return 20.0 * math.log10(volume)


def guess_speaking_seconds(
    text: str,
    words_per_minute: int = 145,
    min_seconds: float = 1.5
) -> float:
    """
    Estimates spoken audio duration in seconds from script text based on speaking rate (WPM).
    Includes a slight breathing pause buffer.
    """
    if not text or not text.strip():
        return min_seconds

    words = re.findall(r'\b\w+\b', text)
    word_count = len(words)
    if word_count == 0:
        return min_seconds

    duration = (word_count / float(words_per_minute)) * 60.0
    return max(min_seconds, round(duration + 0.4, 2))


def seconds_to_samples(seconds: float, sample_rate: int) -> int:
    """Converts a duration in seconds to total audio sample count."""
    return int(round(seconds * sample_rate))


__all__ = [
    "decibels_to_volume",
    "volume_to_decibels",
    "guess_speaking_seconds",
    "seconds_to_samples",
]
