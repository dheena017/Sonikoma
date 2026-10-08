"""
backend/features/creative/thumbnails/__init__.py
─────────────────────────────────────────────────────────────────────────────
Public interface for the AI Thumbnail Generator Studio:
- Schemas: ThumbnailGenerateRequest, ThumbnailGenerateResponse, etc.
- Service: CreativeThumbnailService, thumbnail_service
- Router: thumbnails_router, router
- Generator: generate_thumbnail_package
- AI Skill: thumbnail_ai_skill, DynamicThumbnailConcept
─────────────────────────────────────────────────────────────────────────────
"""

from .schemas import (
    ThumbnailPanelInput,
    ThumbnailGenerateRequest,
    GeneratedThumbnailItem,
    ThumbnailGenerateResponse,
)
from .service import CreativeThumbnailService, thumbnail_service
from .router import thumbnails_router, router
from .generator import generate_thumbnail_package
from .ai_skill import thumbnail_ai_skill, DynamicThumbnailConcept

__all__ = [
    "ThumbnailPanelInput",
    "ThumbnailGenerateRequest",
    "GeneratedThumbnailItem",
    "ThumbnailGenerateResponse",
    "CreativeThumbnailService",
    "thumbnail_service",
    "thumbnails_router",
    "router",
    "generate_thumbnail_package",
    "thumbnail_ai_skill",
    "DynamicThumbnailConcept",
]
