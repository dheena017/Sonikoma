"""
backend/features/landing/__init__.py
─────────────────────────────────────────────────────────────────────────────
Landing Feature Module:
- router:           Master FastAPI router for public landing page endpoints
- landing_router:   Alias for router
- service:          LandingService and landing_service singleton
- schemas:          Pydantic models for landing overview, tiers, and showcase
─────────────────────────────────────────────────────────────────────────────
"""

from .router import router, landing_router
from .service import LandingService, landing_service
from . import schemas

__all__ = [
    "router",
    "landing_router",
    "LandingService",
    "landing_service",
    "schemas",
]
