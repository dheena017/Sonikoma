"""
backend/features/image_editor/services/panel_detection/detect_batch_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Batch Image URL Panel Detection:
- Runs concurrent asynchronous processing across an array of URLs
- Layout classification and dynamic routing (tall strip vs small page)
- Aggregates concurrent results into standardized DetectPanelsBatchResponse
─────────────────────────────────────────────────────────────────────────────
"""

import time
import asyncio
import logging
from typing import Dict, Any

from features.platform.projects.schemas_project import (
    DetectPanelsBatchRequest,
    DetectPanelsBatchResponse,
    DetectSmallPanelsRequest,
    DetectLongPanelsRequest,
)
from features.image_editor.services.panel_detection.detect_type_service import detect_image_layout_type
from features.image_editor.services.panel_detection.detect_small_panels_service import detect_small_panels
from features.image_editor.services.panel_detection.detect_long_panels_service import detect_long_panels

logger = logging.getLogger("sonikoma.services.image.panel_detection.batch")

__all__ = ["detect_batch_panels", "process_single_url"]


# ─────────────────────────────────────────────────────────────────────────────
# 1. Single URL Unit Worker
# ─────────────────────────────────────────────────────────────────────────────

async def process_single_url(url: str, options: DetectPanelsBatchRequest) -> Dict[str, Any]:
    """
    Processes a single image URL within a batch panel detection run.

    Args:
        url (str): Target image URL.
        options (DetectPanelsBatchRequest): Detection options (sensitivity, auto_split, aspect_ratio).

    Returns:
        Dict[str, Any]: Mapped dictionary containing detection outcome and data.
    """
    # ── Stage 1: Guard Clauses ───────────────────────────────────────────────
    if not url or not url.strip():
        return {
            "url": url,
            "success": False,
            "error": "URL is empty or invalid.",
            "panels": [],
        }

    # ── Stage 2: Layout Classification & Routing ─────────────────────────────
    try:
        type_res = await detect_image_layout_type(url=url)
        crop_type_str = str(
            type_res.crop_type.value if hasattr(type_res.crop_type, "value") else type_res.crop_type
        )
        is_tall = (
            crop_type_str in ("long_panels", "ultra_long_panels", "four_koma")
            or (type_res.aspect_ratio or 0) >= 2.0
        )

        # ── Stage 3: Core Algorithmic Dispatching ────────────────────────────
        if is_tall:
            req = DetectLongPanelsRequest(
                url=url,
                sensitivity=options.sensitivity,
                background_mode=options.background_mode,
                auto_split=options.auto_split,
            )
            res = await detect_long_panels(req)
            return {
                "url": url,
                "success": True,
                "crop_type": "long_panels",
                "data": res.model_dump(),
            }
        else:
            req = DetectSmallPanelsRequest(
                url=url,
                aspect_ratio=options.aspect_ratio,
                auto_trim=True,
                snap_to_frame=True,
            )
            res = await detect_small_panels(req)
            return {
                "url": url,
                "success": True,
                "crop_type": "small_panels",
                "data": res.model_dump(),
            }

    except Exception as e:
        logger.error(f"[Batch Detector] Processing failed for URL '{url}': {e}", exc_info=True)
        return {
            "url": url,
            "success": False,
            "error": str(e),
            "panels": [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Concurrent Batch Orchestration Engine
# ─────────────────────────────────────────────────────────────────────────────

async def detect_batch_panels(request: DetectPanelsBatchRequest) -> DetectPanelsBatchResponse:
    """
    Processes multiple image URLs concurrently using asyncio gathering.

    Args:
        request (DetectPanelsBatchRequest): Batch request containing image URLs list and options.

    Returns:
        DetectPanelsBatchResponse: Aggregated results mapped per URL.

    Raises:
        ValueError: If 'urls' list is empty.
    """
    # ── Stage 1: Timing & Guard Clauses ───────────────────────────────────────
    start_time = time.perf_counter()

    if not request or not request.urls:
        raise ValueError("Must provide a non-empty list of 'urls' for batch processing.")

    # ── Stage 2: Concurrent Worker Execution ──────────────────────────────────
    tasks = [process_single_url(url, request) for url in request.urls]
    results = await asyncio.gather(*tasks)

    # ── Stage 3: Structured Output & Traceable Logging ────────────────────────
    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    success_count = sum(1 for r in results if r.get("success"))

    logger.info(
        f"[Batch Detector] Concurrently processed {len(results)} images "
        f"({success_count}/{len(results)} succeeded) in {elapsed_ms}ms"
    )

    return DetectPanelsBatchResponse(
        success=True,
        total_images=len(results),
        results=list(results),
        message=f"Batch processed {len(results)} images in {elapsed_ms}ms ({success_count} succeeded).",
    )
