"""
backend/app/api/v1/scraper/validation.py
─────────────────────────────────────────────────────────────────────────────
Image validation and reading-order sorting tools.
POST /validate-images   – Validate and filter candidate image URLs
POST /sort-images       – Naturally sort & re-index into reading order
─────────────────────────────────────────────────────────────────────────────
"""

import logging

from fastapi import APIRouter, Depends

from api.dependencies.auth import get_current_user
from schemas.scraper import (
    ValidateImagesRequest,
    ValidateImagesResponse,
    SortImagesRequest,
    SortImagesResponse,
)
from services.scraper.content_validator import ImageValidator
from services.scraper.image_order_resolver import OrderResolver

logger = logging.getLogger("sonikoma.api.scraper.validation")
router = APIRouter()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/validate-images",
    response_model=ValidateImagesResponse,
    summary="Validate and filter candidate image URLs"
)
async def validate_images_endpoint(
    body: ValidateImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validates a list of candidate image URLs. Rejects banners, icons, tracking
    pixels, and images below minimum dimension thresholds. Returns accepted
    images plus a rejection report.
    """
    accepted, rejections = ImageValidator.validate_candidates(
        candidates=body.images,  # type: ignore
        filter_banners=body.filter_banners
    )
    return ValidateImagesResponse(
        success=True,
        valid_count=len(accepted),
        rejected_count=len(rejections),
        images=[img.model_dump() for img in accepted],
        rejected=rejections
    )


@router.post(
    "/sort-images",
    response_model=SortImagesResponse,
    summary="Naturally sort and re-index image URLs into sequential reading order"
)
async def sort_images_endpoint(
    body: SortImagesRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Applies natural sort ordering to a list of comic panel image URLs,
    re-indexing them into the correct top-to-bottom reading sequence.
    """
    sorted_imgs = OrderResolver.resolve_order(body.images)
    return SortImagesResponse(
        success=True,
        total_images=len(sorted_imgs),
        images=[img.model_dump() if hasattr(img, "model_dump") else img for img in sorted_imgs]
    )
