"""
backend/app/services/image/image_metadata.py
─────────────────────────────────────────────────────────────────────────────
Service functions for extracting image metadata, specifications, and
performing validation / visual diagnostic checks.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import asyncio
import logging
from typing import Dict, Any

import services.image.image_utils as img_utils

logger = logging.getLogger("sonikoma.services.image.metadata")


async def get_image_metadata_service(url: str) -> Dict[str, Any]:
    """Downloads an image from URL and extracts its metadata, size, aspect ratio, and fingerprint."""
    image_bytes = await img_utils.download_image_to_memory(url)
    meta = img_utils.get_image_meta(image_bytes)
    fingerprint = img_utils.fingerprint_image(image_bytes)
    return {
        "success": True,
        "width": meta.width,
        "height": meta.height,
        "format": meta.format,
        "aspectRatio": meta.aspectRatio,
        "megapixels": meta.megapixels,
        "orientation": meta.orientation,
        "sizeBytes": meta.sizeBytes,
        "fingerprint": fingerprint
    }


async def debug_yolo_detections_service(url: str, conf: float = 0.25) -> bytes:
    """Runs YOLO panel box detection and returns the annotated visualization image bytes."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_f:
            tmp_f.write(resolved["data"])
            tmp_path = tmp_f.name

        from media.image.debug_visualizer import draw_yolo_detections
        annotated_bytes = await asyncio.to_thread(draw_yolo_detections, tmp_path, conf)
        if annotated_bytes is None:
            raise ValueError("YOLO model is not available.")
        return annotated_bytes
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
