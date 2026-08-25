"""
backend/app/services/image/panel_detection/detect_batch_service.py
─────────────────────────────────────────────────────────────────────────────
Orchestrator Service for Batch Image URL Panel Detection:
- Runs concurrent asynchronous processing across an array of URLs
- Returns DetectPanelsBatchResponse with results mapped per URL
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import Dict, Any

from schemas.project import (
    DetectPanelsBatchRequest,
    DetectPanelsBatchResponse,
    DetectSmallPanelsRequest,
    DetectLongPanelsRequest
)
from services.image.crop.detect_type_service import detect_image_layout_type
from services.image.panel_detection.detect_small_panels_service import detect_small_panels_boxes
from services.image.panel_detection.detect_long_panels_service import detect_long_panels_boxes

logger = logging.getLogger("sonikoma.services.panel_detection.batch")


async def _process_single_url(url: str, options: DetectPanelsBatchRequest) -> Dict[str, Any]:
    try:
        # Step 1: Detect layout type
        type_res = await detect_image_layout_type(url=url)
        is_tall = type_res.crop_type == "long_panels" or type_res.aspect_ratio >= 2.2

        # Step 2: Route to appropriate service
        if is_tall:
            req = DetectLongPanelsRequest(
                url=url,
                sensitivity=options.sensitivity,
                background_mode=options.background_mode,
                auto_split=options.auto_split
            )
            res = await detect_long_panels_boxes(req)
            return {
                "url": url,
                "success": True,
                "crop_type": "long_panels",
                "data": res.model_dump()
            }
        else:
            req = DetectSmallPanelsRequest(
                url=url,
                aspect_ratio=options.aspect_ratio,
                auto_trim=True,
                snap_to_frame=True
            )
            res = await detect_small_panels_boxes(req)
            return {
                "url": url,
                "success": True,
                "crop_type": "small_panels",
                "data": res.model_dump()
            }
    except Exception as e:
        logger.error(f"[Batch Detector] Failed on {url}: {e}", exc_info=True)
        return {
            "url": url,
            "success": False,
            "error": str(e),
            "panels": []
        }


async def detect_batch_panels(request: DetectPanelsBatchRequest) -> DetectPanelsBatchResponse:
    """Processes multiple image URLs concurrently."""
    tasks = [_process_single_url(url, request) for url in request.urls]
    results = await asyncio.gather(*tasks)

    return DetectPanelsBatchResponse(
        success=True,
        total_images=len(results),
        results=list(results),
        message=f"Batch processed {len(results)} images."
    )
