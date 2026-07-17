"""
backend/app/services/image/image_detection.py
─────────────────────────────────────────────────────────────────────────────
Service functions for speech bubble detection, YOLO visualizer overlays,
and bubble cleaning underlays.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import uuid
import logging
import asyncio
from typing import List, Dict, Any

from media.image.cleaner import remove_speech_bubbles
import services.image.image_utils as img_utils
from utils.cache import stitched_cache, edit_history
from utils.supabase_storage import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.services.image.detection")


async def debug_yolo_detections_service(url: str, confidence: float = 0.25) -> Dict[str, Any]:
    """Generates a debug preview of the YOLO speech bubble boundary boxes on the panel."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    
    # We pass visual_debug=True to the clean pipeline to draw green boundaries
    cleaned_bytes, boxes = await remove_speech_bubbles(
        resolved["data"],
        confidence=confidence,
        visual_debug=True
    )

    filename = f"yolo_debug_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        cleaned_bytes,
        "panels",
        filename,
        "image/png"
    )

    unique_id = f"yolo_debug_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": cleaned_bytes, "content_type": "image/png"})
    return {
        "success": True,
        "url": proxy_url,
        "detections_count": len(boxes),
        "boxes": boxes
    }


async def bubble_cleaning_service(url: str, confidence: float = 0.25) -> Dict[str, Any]:
    """Removes speech bubbles and paints underlay reconstruction."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    cleaned_bytes, boxes = await remove_speech_bubbles(
        resolved["data"],
        confidence=confidence,
        visual_debug=False
    )

    filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        cleaned_bytes,
        "panels",
        filename,
        "image/png"
    )

    unique_id = f"cleaned_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": cleaned_bytes, "content_type": "image/png"})
    edit_history.set(proxy_url, url)
    try:
        from database import db
        db.save_edit_history(proxy_url, url)
    except Exception:
        pass

    return {
        "success": True,
        "url": proxy_url,
        "bubbles_removed": len(boxes)
    }


async def bubble_cleaning_batch_service(urls: List[str], confidence: float = 0.25) -> Dict[str, Any]:
    """Runs concurrent cleaning of speech bubbles on a batch of panel URLs."""
    results = []
    semaphore = asyncio.Semaphore(4)

    async def clean_one(u: str):
        async with semaphore:
            try:
                res = await bubble_cleaning_service(u, confidence)
                results.append({"url": u, **res})
            except Exception as e:
                results.append({"url": u, "success": False, "error": str(e)})

    await asyncio.gather(*[clean_one(u) for u in urls])
    return {"success": True, "results": results}
