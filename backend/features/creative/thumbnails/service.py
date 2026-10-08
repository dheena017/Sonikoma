"""
backend/features/creative/thumbnails/service.py
─────────────────────────────────────────────────────────────────────────────
Service layer for AI Thumbnail Generator Studio:
Orchestrates batch generation (3 or 6 variants) and metadata caching.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
from typing import List, Dict, Any, Optional

from features.creative.thumbnails.schemas import (
    ThumbnailGenerateRequest,
    ThumbnailGenerateResponse,
    GeneratedThumbnailItem,
)
from features.creative.thumbnails.generator import generate_thumbnail_package
from features.creative.thumbnails.ai_skill import thumbnail_ai_skill

logger = logging.getLogger("sonikoma.creative.thumbnails.service")


class CreativeThumbnailService:
    """Service facade for managing thumbnail generation via AI Skill."""

    def __init__(self):
        self._history: Dict[str, GeneratedThumbnailItem] = {}

    async def generate_batch(
        self, request: ThumbnailGenerateRequest
    ) -> ThumbnailGenerateResponse:
        """Generates 3 or 6 distinct thumbnail images based on panels and AI prompt."""
        start_time = time.perf_counter()

        # 1. Synthesize non-hardcoded AI concepts with Vision/LLM
        concepts = await thumbnail_ai_skill.generate_thumbnail_concepts(
            series_title=request.series_title,
            genre=request.genre,
            user_prompt=request.prompt,
            panels=request.panels or [],
            count=request.count,
        )

        # 2. Render 1280x720 HD compositions using the AI concepts
        thumbnails = await generate_thumbnail_package(request, concepts=concepts)

        for t in thumbnails:
            self._history[t.id] = t

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        logger.info(
            f"[ThumbnailService] Generated {len(thumbnails)} AI-driven thumbnails for '{request.series_title}' in {elapsed_ms}ms"
        )

        return ThumbnailGenerateResponse(
            success=True,
            count=len(thumbnails),
            prompt=request.prompt or "AI High-CTR Multi-Variant Composition",
            series_title=request.series_title or "Webtoon Climax",
            thumbnails=thumbnails,
            execution_time_ms=elapsed_ms,
        )


thumbnail_service = CreativeThumbnailService()

__all__ = ["CreativeThumbnailService", "thumbnail_service"]
