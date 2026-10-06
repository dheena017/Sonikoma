"""
backend/features/intelligence/series/__init__.py
─────────────────────────────────────────────────────────────────────────────
AI Generated Series domain module.
Exports master router, SeriesService facade, schemas, repositories, and services.
─────────────────────────────────────────────────────────────────────────────
"""

from features.intelligence.series.router import (
    ai_series_master_router,
    series_router,
    router,
)
from features.intelligence.series.service import (
    SeriesService,
    series_service,
)
from features.intelligence.series.repositories import (
    AISeriesRepository,
    ai_series_repo,
)
from features.intelligence.series import schemas
from features.intelligence.series import services

__all__ = [
    "ai_series_master_router",
    "series_router",
    "router",
    "SeriesService",
    "series_service",
    "AISeriesRepository",
    "ai_series_repo",
    "schemas",
    "services",
]
