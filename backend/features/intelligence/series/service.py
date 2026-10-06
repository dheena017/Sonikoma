"""
backend/features/intelligence/series/service.py
─────────────────────────────────────────────────────────────────────────────
AI Generated Series Service Facade:
Consolidates domain operations across story orchestration, image rendering,
vocal dubbing, and continuity memory.
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.series.services.series_orchestrator import (
    SeriesOrchestrator,
    series_orchestrator,
    ART_STYLE_PROMPT_PREFIXES,
    KINETIC_MOTION_PRESETS,
)
from features.intelligence.series.services.series_image_service import (
    SeriesImageService,
    series_image_service,
)
from features.intelligence.series.services.series_audio_service import (
    SeriesAudioService,
    series_audio_service,
)
from features.intelligence.series.services.series_memory_engine import (
    SeriesMemoryEngine,
    series_memory_engine,
)


class SeriesService:
    """Consolidated business service facade for AI Generated Series production."""

    def __init__(self):
        self.orchestrator = series_orchestrator
        self.image = series_image_service
        self.audio = series_audio_service
        self.memory = series_memory_engine


series_service = SeriesService()

__all__ = [
    "SeriesService",
    "series_service",
    "series_orchestrator",
    "series_image_service",
    "series_audio_service",
    "series_memory_engine",
    "ART_STYLE_PROMPT_PREFIXES",
    "KINETIC_MOTION_PRESETS",
]
