"""
backend/features/audio/mixer/auto_ducking_service.py
─────────────────────────────────────────────────────────────────────────────
Automatic dialogue ducking: smoothly reduces background music volume during
spoken dialogue segments so voices are always crisp and audible.
─────────────────────────────────────────────────────────────────────────────
"""

import math
from typing import List, Tuple
from pydub import AudioSegment


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _find_talking_times(
    voice_track: AudioSegment,
    quiet_threshold_db: float = -35.0,
    chunk_ms: int = 50
) -> List[Tuple[int, int]]:
    """Identifies time intervals (start_ms, end_ms) where the voice track has active speech."""
    active_ranges: List[Tuple[int, int]] = []
    in_speech = False
    start_t = 0

    for i in range(0, len(voice_track), chunk_ms):
        chunk = voice_track[i : i + chunk_ms]
        if chunk.dBFS > quiet_threshold_db:
            if not in_speech:
                start_t = max(0, i - 100)  # lead-in margin
                in_speech = True
        else:
            if in_speech:
                end_t = min(len(voice_track), i + 200)  # release margin
                active_ranges.append((start_t, end_t))
                in_speech = False

    if in_speech:
        active_ranges.append((start_t, len(voice_track)))

    return active_ranges


def _make_music_quieter(
    music: AudioSegment,
    talking_times: List[Tuple[int, int]],
    volume_drop: float,
    fade_ms: int
) -> AudioSegment:
    """Applies volume attenuation to the music track over the specified time intervals."""
    if not talking_times or volume_drop >= 1.0:
        return music

    gain_db = 20.0 * math.log10(max(0.01, volume_drop))
    result = AudioSegment.empty()
    last_idx = 0

    for start_ms, end_ms in talking_times:
        if start_ms > last_idx:
            # Normal volume music section
            result += music[last_idx:start_ms]

        # Ducked music section
        ducked_slice = music[start_ms:end_ms] + gain_db
        if len(ducked_slice) > fade_ms * 2:
            ducked_slice = ducked_slice.fade_in(fade_ms).fade_out(fade_ms)

        result += ducked_slice
        last_idx = end_ms

    if last_idx < len(music):
        result += music[last_idx:]

    return result


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def lower_music_when_speaking(
    music_track: AudioSegment,
    voice_track: AudioSegment,
    ducking_factor: float = 0.25,
    fade_duration_ms: int = 300
) -> AudioSegment:
    """
    Automatically lowers music volume while characters speak, then brings it back up smoothly.
    """
    if len(voice_track) == 0 or len(music_track) == 0:
        return music_track

    speech_times = _find_talking_times(voice_track)
    return _make_music_quieter(music_track, speech_times, ducking_factor, fade_duration_ms)


__all__ = ["lower_music_when_speaking"]
