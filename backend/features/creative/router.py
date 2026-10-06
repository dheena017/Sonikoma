"""
backend/features/creative/router.py
─────────────────────────────────────────────────────────────────────────────
Unified router for the Creative domain:
Combines:
  - /export: Video packaging, multi-format rendering presets, ZIP bundles
  - /youtube: YouTube OAuth2 credentials, upload channels, publishing history
─────────────────────────────────────────────────────────────────────────────
"""

from fastapi import APIRouter

from features.creative.export.router import export_router

router = APIRouter(prefix="/creative", tags=["Creative"])

router.include_router(export_router, prefix="/export", tags=["Creative: Export & Distribution"])

creative_router = router

__all__ = [
    "router",
    "creative_router",
    "export_router",
]
