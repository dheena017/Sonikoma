"""
backend/features/audio/mixer/music_loop_service.py
─────────────────────────────────────────────────────────────────────────────
Seamless background music looping: extends music tracks with smooth crossfades
to match exact storyboard or scene durations.
─────────────────────────────────────────────────────────────────────────────
"""

from pydub import AudioSegment


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _count_loops_needed(
    music_length_ms: int,
    desired_length_ms: int
) -> int:
    """Calculates how many full repetitions are required to cover target time."""
    if music_length_ms <= 0:
        return 0
    return int(desired_length_ms / music_length_ms) + 1


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def loop_music(
    music_track: AudioSegment,
    target_duration_ms: int,
    crossfade_ms: int = 500
) -> AudioSegment:
    """
    Repeats music smoothly so it matches the full length of the scene.
    """
    if len(music_track) == 0:
        return AudioSegment.silent(duration=target_duration_ms)

    if len(music_track) >= target_duration_ms:
        return music_track[:target_duration_ms]

    loops = _count_loops_needed(len(music_track), target_duration_ms)
    combined = music_track

    for _ in range(loops - 1):
        if crossfade_ms > 0 and len(music_track) > crossfade_ms * 2:
            combined = combined.append(music_track, crossfade=crossfade_ms)
        else:
            combined += music_track

    return combined[:target_duration_ms]


__all__ = ["loop_music"]
