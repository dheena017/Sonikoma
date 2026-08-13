"""
backend/app/services/audio/processing/__init__.py
─────────────────────────────────────────────────────────────────────────────
Audio signal processing and feature extraction services package.
─────────────────────────────────────────────────────────────────────────────
"""

from services.audio.processing.audio_processor import (
    detect_silence,
    segment_by_energy,
    extract_summary_stats,
    save_audio_segment,
    analyze_audio_service,
    detect_silence_service,
    segment_by_energy_service,
    load_audio_service,
    detect_audio_silence_segments,
    segment_audio_by_energy_peaks,
    analyze_audio_spectral_stats,
)

__all__ = [
    "detect_silence",
    "segment_by_energy",
    "extract_summary_stats",
    "save_audio_segment",
    "analyze_audio_service",
    "detect_silence_service",
    "segment_by_energy_service",
    "load_audio_service",
    "detect_audio_silence_segments",
    "segment_audio_by_energy_peaks",
    "analyze_audio_spectral_stats",
]
