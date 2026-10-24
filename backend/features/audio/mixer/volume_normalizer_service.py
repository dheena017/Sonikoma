"""
backend/features/audio/mixer/volume_normalizer_service.py
─────────────────────────────────────────────────────────────────────────────
Audio loudness balancing: normalizes volume to standard broadcast dBFS
and prevents harsh distortion or clipping.
─────────────────────────────────────────────────────────────────────────────
"""

from pydub import AudioSegment


# ── Internal Helpers (Top) ──────────────────────────────────────────────────

def _find_loudest_part(
    sound: AudioSegment,
    safe_ceiling_db: float = -1.0
) -> float:
    """Calculates maximum safe gain increase before peak clipping occurs."""
    peak_db = sound.max_dBFS
    return safe_ceiling_db - peak_db


# ── Canonical Public API (Bottom) ───────────────────────────────────────────

def balance_volume(
    audio_track: AudioSegment,
    target_loudness_dbfs: float = -16.0,
    peak_limit_db: float = -1.0
) -> AudioSegment:
    """
    Adjusts volume so it is neither too quiet nor too loud, and stops harsh distortions.
    """
    if len(audio_track) == 0:
        return audio_track

    # Calculate change needed to hit target dBFS
    change_in_dbfs = target_loudness_dbfs - audio_track.dBFS

    # Ensure we don't clip over peak ceiling
    safe_max_boost = _find_loudest_part(audio_track, peak_limit_db)
    final_gain = min(change_in_dbfs, safe_max_boost)

    return audio_track.apply_gain(final_gain)


__all__ = ["balance_volume"]
