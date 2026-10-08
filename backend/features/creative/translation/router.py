"""
backend/features/creative/translation/router.py
─────────────────────────────────────────────────────────────────────────────
FastAPI Router for Comic & Webtoon Translation and Localization:
- POST /api/v1/creative/translation/translate
- POST /api/v1/creative/translation/batch-translate
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from fastapi import APIRouter, HTTPException

from features.creative.translation.schemas import (
    TranslationRequest,
    TranslationResponse,
    BatchTranslationRequest,
    BatchTranslationResponse,
)
from features.creative.translation.service import translation_service

logger = logging.getLogger("sonikoma.creative.translation.router")
router = APIRouter()


@router.post(
    "/translate",
    response_model=TranslationResponse,
    summary="Translate Comic Dialogue / Narration",
)
@router.post(
    "/skills/translate",
    response_model=TranslationResponse,
    include_in_schema=False,
)
async def translate_endpoint(body: TranslationRequest):
    """
    Translates comic dialogue, speech bubbles, or narrative text into the requested target language
    with tone adaptation (Natural, Shonen, Sakuga, Slang) and sound effects preservation.
    """
    try:
        return await translation_service.translate(body)
    except Exception as e:
        logger.error(f"[Translation Router] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/batch-translate",
    response_model=BatchTranslationResponse,
    summary="Batch Translate Dialogue Across Panels",
)
async def batch_translate_endpoint(body: BatchTranslationRequest):
    """Translates a batch list of comic panels or dialogue strings."""
    try:
        return await translation_service.batch_translate(body)
    except Exception as e:
        logger.error(f"[Translation Router] Batch error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


translation_router = router
__all__ = ["translation_router", "router"]
