"""
backend/features/landing/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for compiling public platform landing statistics, demos, and tiers.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List
from app.core.config import API_VERSION
from .schemas import (
    ShowcaseSample,
    LandingStatsResponse,
    PricingTier,
    PricingFeature,
    LandingOverviewResponse,
)

DEFAULT_SHOWCASE: List[ShowcaseSample] = [
    ShowcaseSample(
        id="demo_1",
        title="Solo Hunter Awakening",
        description="Action-packed manhwa scene with dramatic orchestral score and Ken Burns zoom.",
        comic_title="The Dungeon Awakens",
        video_url="/storage/demo/hunter_awakening.mp4",
        thumbnail_url="/storage/demo/hunter_thumb.jpg",
        duration_seconds=45.0,
        genre="Action / Fantasy"
    ),
    ShowcaseSample(
        id="demo_2",
        title="Midnight Rooftop Encounter",
        description="Atmospheric romance dialogue with subtle rain ambient SFX and emotional piano.",
        comic_title="City of Starlight",
        video_url="/storage/demo/rooftop.mp4",
        thumbnail_url="/storage/demo/rooftop_thumb.jpg",
        duration_seconds=32.5,
        genre="Drama / Romance"
    )
]

DEFAULT_TIERS: List[PricingTier] = [
    PricingTier(
        id="free",
        name="Starter",
        price_monthly=0.0,
        price_annual=0.0,
        description="Perfect for testing comic animation workflows.",
        popular=False,
        features=[
            PricingFeature(name="720p Video Exports"),
            PricingFeature(name="Standard Edge-TTS Voices"),
            PricingFeature(name="Webtoon Scraper (3 chapters/day)"),
            PricingFeature(name="1 Active Project", included=True),
        ]
    ),
    PricingTier(
        id="pro",
        name="Creator Pro",
        price_monthly=29.0,
        price_annual=24.0,
        description="For ambitious creators producing weekly serialized webtoon video series.",
        popular=True,
        features=[
            PricingFeature(name="4K 60FPS Video Exports"),
            PricingFeature(name="ElevenLabs & OpenAI Ultra-Realistic Voices"),
            PricingFeature(name="Unlimited Webtoon Scraping"),
            PricingFeature(name="Automated YouTube Direct Publishing"),
            PricingFeature(name="Unlimited Active Projects"),
        ]
    )
]


class LandingService:
    """Service handling platform public landing stats, showcase videos, and tiers."""

    @staticmethod
    def get_overview() -> LandingOverviewResponse:
        return LandingOverviewResponse(
            stats=LandingStatsResponse(),
            showcase=DEFAULT_SHOWCASE,
            tiers=DEFAULT_TIERS,
            version=API_VERSION
        )

    @staticmethod
    def get_showcase_samples() -> List[ShowcaseSample]:
        return DEFAULT_SHOWCASE

    @staticmethod
    def get_pricing_tiers() -> List[PricingTier]:
        return DEFAULT_TIERS

    @staticmethod
    def get_stats() -> LandingStatsResponse:
        return LandingStatsResponse()


landing_service = LandingService()

__all__ = [
    "LandingService",
    "landing_service",
    "DEFAULT_SHOWCASE",
    "DEFAULT_TIERS",
]
