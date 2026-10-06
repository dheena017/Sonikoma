"""
backend/features/intelligence/__init__.py
─────────────────────────────────────────────────────────────────────────────
Intelligence domain module entry point.
Exports root router, IntelligenceService facade, schemas, ai, and series.
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.router import (
    router,
    intelligence_router,
    ai_router,
    series_router,
)
from features.intelligence.service import (
    IntelligenceService,
    intelligence_service,
    AIService,
    ai_service,
    SeriesService,
    series_service,
)
from features.intelligence import ai
from features.intelligence import series

__all__ = [
    "router",
    "intelligence_router",
    "ai_router",
    "series_router",
    "IntelligenceService",
    "intelligence_service",
    "AIService",
    "ai_service",
    "SeriesService",
    "series_service",
    "ai",
    "series",
]
