"""
backend/features/landing/router.py
─────────────────────────────────────────────────────────────────────────────
FastAPI router for public landing page showcase, stats, and tier specifications.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import List
from fastapi import APIRouter

from .schemas import LandingOverviewResponse, ShowcaseSample, PricingTier
from .service import landing_service

router = APIRouter(prefix="/landing", tags=["Landing & Public Showcase"])


@router.get(
    "/overview",
    response_model=LandingOverviewResponse,
    summary="Get complete landing page bundle",
    description="Returns public platform stats, video showcase samples, pricing tiers, and version info."
)
async def get_landing_overview():
    return landing_service.get_overview()


@router.get(
    "/showcase",
    response_model=List[ShowcaseSample],
    summary="Get video showcase demo reel samples"
)
async def get_showcase_samples():
    return landing_service.get_showcase_samples()


@router.get(
    "/pricing",
    response_model=List[PricingTier],
    summary="Get subscription pricing plans and capability limits"
)
async def get_pricing_tiers():
    return landing_service.get_pricing_tiers()


landing_router = router

__all__ = [
    "router",
    "landing_router",
]
