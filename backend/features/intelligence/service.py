"""
backend/features/intelligence/service.py
─────────────────────────────────────────────────────────────────────────────
Unified Intelligence Service Facade:
Combines AIService (multimodal generation & skills) and SeriesService
(multi-chapter story orchestration, audio dubbing, continuity memory).
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.ai.service import AIService, ai_service
from features.intelligence.series.service import SeriesService, series_service


class IntelligenceService:
    """Unified service facade for the Intelligence domain."""

    def __init__(self):
        self.ai = ai_service
        self.series = series_service


intelligence_service = IntelligenceService()

__all__ = [
    "IntelligenceService",
    "intelligence_service",
    "AIService",
    "ai_service",
    "SeriesService",
    "series_service",
]
