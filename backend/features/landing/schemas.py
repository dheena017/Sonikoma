"""
backend/features/landing/schemas.py
─────────────────────────────────────────────────────────────────────────────
Pydantic schemas for public landing page showcase, platform statistics, and tiers.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ShowcaseSample(BaseModel):
    id: str
    title: str
    description: str
    comic_title: str
    video_url: str
    thumbnail_url: str
    duration_seconds: float
    genre: str


class LandingStatsResponse(BaseModel):
    total_creations: int = 12500
    active_creators: int = 3400
    supported_languages: int = 50
    ai_models_count: int = 12
    uptime_percentage: float = 99.98


class PricingFeature(BaseModel):
    name: str
    included: bool = True
    info: Optional[str] = None


class PricingTier(BaseModel):
    id: str
    name: str
    price_monthly: float
    price_annual: float
    description: str
    popular: bool = False
    features: List[PricingFeature]


class LandingOverviewResponse(BaseModel):
    stats: LandingStatsResponse
    showcase: List[ShowcaseSample]
    tiers: List[PricingTier]
    version: str


__all__ = [
    "ShowcaseSample",
    "LandingStatsResponse",
    "PricingFeature",
    "PricingTier",
    "LandingOverviewResponse",
]
