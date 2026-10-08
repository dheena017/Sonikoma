"""
backend/features/intelligence/series/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI Generated Series domain services:
- series_orchestrator: progressive chapter production director, Turbo synthesis
- arc_architect: multi-session narrative arc architect, cast DNA & world bible
- panel_synthesizer: authentic 2D panel synthesis, speech bubbles, camera blocking
- series_memory_engine: franchise canon continuity, style profiles, creator RLHF feedback
- series_image_service: 2D image synthesis, Pollinations routing, caching, fallbacks
- series_audio_service: Edge-TTS vocal dubbing, character voice casting, audition previews
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.series.services.series_audio_service import (
    SeriesAudioService,
    series_audio_service,
)
from features.intelligence.series.services.series_image_service import (
    SeriesImageService,
    series_image_service,
)
from features.intelligence.series.services.series_memory_engine import (
    SeriesMemoryEngine,
    series_memory_engine,
)
from features.intelligence.series.services.series_orchestrator import (
    SeriesOrchestrator,
    series_orchestrator,
)
from features.intelligence.series.services.arc_architect import (
    ArcArchitect,
    arc_architect,
)
from features.intelligence.series.services.panel_synthesizer import (
    PanelSynthesizer,
    panel_synthesizer,
)
from features.intelligence.series.styles import (
    ART_STYLE_PROMPT_PREFIXES,
    KINETIC_MOTION_PRESETS,
)

__all__ = [
    # Audio Service
    "SeriesAudioService",
    "series_audio_service",
    # Image Service
    "SeriesImageService",
    "series_image_service",
    # Memory Engine
    "SeriesMemoryEngine",
    "series_memory_engine",
    # Orchestrator & Synthesizers
    "SeriesOrchestrator",
    "series_orchestrator",
    "ArcArchitect",
    "arc_architect",
    "PanelSynthesizer",
    "panel_synthesizer",
    # Legacy re-exports
    "ART_STYLE_PROMPT_PREFIXES",
    "KINETIC_MOTION_PRESETS",
]
