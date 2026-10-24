"""
backend/features/image/router/detect.py
─────────────────────────────────────────────────────────────────────────────
Detection & Speech Bubble Cleaning Router:
- Multimodal Comic Scanner: Composite panels + speech bubbles + character entities
- Dialogue Bubble Inpainting: Deep learning & contour guided bubble erasure
- YOLO Boundary Overlay Generation for Visual Diagnostics
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import asyncio
import logging
from typing import Optional, List
from fastapi import APIRouter, HTTPException

from features.image.schemas import (
    RemoveBubblesRequest,
    RemoveBubblesBatchRequest,
)
from features.platform.projects.schemas_project import (
    DetectPanelsUrlRequest,
    DetectCompositeResponse,
)
from features.image.utils.media_utils import download_image_to_memory
from features.image.detector.detect_composite_service import detect_composite_panels
from features.image.detector.speech_bubble_cleaner import clean_speech_bubbles_async
from database.supabase import upload_to_supabase_bucket
from app.core.cache import stitched_cache

logger = logging.getLogger("sonikoma.features.image.router.detect")
router = APIRouter()


@router.post("/detect-composite", response_model=DetectCompositeResponse, summary="All-in-One multimodal comic page scanner")
async def detect_composite_endpoint(body: DetectPanelsUrlRequest):
    """Executes OpenCV panel detection, YOLO speech bubble segmentation, and character recognition in a single call."""
    try:
        return await detect_composite_panels(body)
    except Exception as exc:
        logger.error(f"[DetectComposite API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/remove-speech-bubbles", summary="Clean speech bubbles from panel and reconstruct underlying art")
async def remove_speech_bubbles_endpoint(body: RemoveBubblesRequest):
    """Detects dialogue bubbles and thought clouds, executing Navier-Stokes boundary inpainting."""
    try:
        buf = await download_image_to_memory(body.url)
        conf = body.confidence if body.confidence is not None else (body.sensitivity or 50.0)

        cleaned_bytes, boxes = await clean_speech_bubbles_async(
            image_input=buf,
            sensitivity=conf if conf > 1.0 else conf * 100.0
        )

        filename = f"clean_{uuid.uuid4().hex[:8]}.png"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            cleaned_bytes,
            "panels",
            filename,
            "image/png"
        )
        final_url = supabase_url or f"/api/v1/images/cached/{filename}"
        if not supabase_url:
            stitched_cache.set(filename, {"data": cleaned_bytes, "content_type": "image/png"})

        return {
            "success": True,
            "url": final_url,
            "bubbles_removed": len(boxes),
            "boxes": boxes
        }
    except Exception as exc:
        logger.error(f"[Bubble Cleaner API] Error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/remove-speech-bubbles-batch", summary="Batch clean speech bubbles from multiple panels concurrently")
async def remove_speech_bubbles_batch_endpoint(body: RemoveBubblesBatchRequest):
    """Concurrently cleans dialogue bubbles from a list of panel URLs."""
    try:
        async def clean_one(url: str):
            try:
                buf = await download_image_to_memory(url)
                cleaned_bytes, boxes = await clean_speech_bubbles_async(image_input=buf)
                filename = f"clean_{uuid.uuid4().hex[:8]}.png"
                supabase_url = await asyncio.to_thread(
                    upload_to_supabase_bucket,
                    cleaned_bytes,
                    "panels",
                    filename,
                    "image/png"
                )
                final_url = supabase_url or f"/api/v1/images/cached/{filename}"
                if not supabase_url:
                    stitched_cache.set(filename, {"data": cleaned_bytes, "content_type": "image/png"})
                return {"url": final_url, "bubbles_removed": len(boxes), "success": True}
            except Exception as e:
                return {"url": url, "error": str(e), "success": False}

        results = await asyncio.gather(*[clean_one(u) for u in body.urls])
        return {"success": True, "results": results}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


__all__ = ["router"]
