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
from features.creative.agent.router import agent_router
from features.creative.thumbnails.router import thumbnails_router
from features.creative.translation.router import translation_router

router = APIRouter(prefix="/creative", tags=["Creative"])

router.include_router(export_router, prefix="/export", tags=["Creative: Export & Distribution"])
router.include_router(agent_router, prefix="/agent", tags=["Creative: Autonomous AI Agent"])
router.include_router(thumbnails_router, prefix="/thumbnails", tags=["Creative: Thumbnail Studio"])
router.include_router(translation_router, prefix="/translation", tags=["Creative: Translation & Localization Studio"])

creative_router = router

__all__ = [
    "router",
    "creative_router",
    "export_router",
    "agent_router",
    "thumbnails_router",
    "translation_router",
]
