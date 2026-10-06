"""
backend/app/providers/librosa/__init__.py
─────────────────────────────────────────────────────────────────────────────
Librosa audio analysis engine, client, feature contracts, and helpers package.
─────────────────────────────────────────────────────────────────────────────
"""

from ai_engine.providers.librosa.types import (
    AudioFeatures,
    SilenceSegment,
    EnergySegment,
)
from ai_engine.providers.librosa.client import (
    LibrosaClient,
    LIBROSA_AVAILABLE,
)
from ai_engine.providers.librosa.engine import (
    LibrosaEngine,
    get_librosa_engine,
)
from ai_engine.providers.librosa.helpers import (
    frames_to_time,
    time_to_frames,
    amplitude_to_db,
)

__all__ = [
    # Types
    "AudioFeatures",
    "SilenceSegment",
    "EnergySegment",
    # Client & Engine
    "LibrosaClient",
    "LibrosaEngine",
    "get_librosa_engine",
    "LIBROSA_AVAILABLE",
    # Helpers
    "frames_to_time",
    "time_to_frames",
    "amplitude_to_db",
]
