"""
backend/features/creative/thumbnails/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for AI Thumbnail Generator Studio:
Orchestrates single 16:9 YouTube thumbnail generation and metadata caching.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging

from features.creative.thumbnails.schemas import (
    ThumbnailGenerateRequest,
    ThumbnailGenerateResponse,
)
from features.creative.thumbnails.generator import generate_thumbnail_package

logger = logging.getLogger("sonikoma.creative.thumbnails.service")


class CreativeThumbnailService:
    """Service facade for managing single 16:9 YouTube thumbnail generation."""

    async def generate_thumbnail(
        self, request: ThumbnailGenerateRequest
    ) -> ThumbnailGenerateResponse:
        """Generates 1 high-CTR 16:9 YouTube thumbnail directly from AI prompt."""
        start_time = time.perf_counter()

        # Render 1280x720 HD composition directly using central Smart Routing
        thumbnails = await generate_thumbnail_package(request)

        top_item = thumbnails[0] if thumbnails else None
        tier_used = getattr(top_item, "tier_used", "Tier 1: Primary")
        model_used = getattr(top_item, "model_used", "flux-anime")
        provider_used = getattr(top_item, "provider_used", "Pollinations AI")
        cascade_path = getattr(top_item, "cascade_path", None)
        routing_msg = getattr(top_item, "routing_message", f"Generated via {tier_used}: {model_used} ({provider_used})")

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(
            f"[ThumbnailService] Generated {len(thumbnails)} AI thumbnail(s) for '{request.series_title}' in {elapsed_ms}ms | {tier_used} -> {model_used} ({provider_used})"
        )

        return ThumbnailGenerateResponse(
            success=True,
            count=len(thumbnails),
            prompt=request.prompt or "AI High-CTR Multi-Variant Composition",
            series_title=request.series_title or "Webtoon Climax",
            thumbnails=thumbnails,
            execution_time_ms=elapsed_ms,
            aspect_ratio=getattr(top_item, "aspect_ratio", request.aspect_ratio or "16:9"),
            tier_used=tier_used,
            model_used=model_used,
            provider_used=provider_used,
            cascade_path=cascade_path,
            routing_message=routing_msg,
        )


thumbnail_service = CreativeThumbnailService()

__all__ = ["CreativeThumbnailService", "thumbnail_service"]
