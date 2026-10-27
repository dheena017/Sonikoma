"""
backend/features/image/stitching/merge_service.py
─────────────────────────────────────────────────────────────────────────────
High-Level Image & Panel Merge Service:
- Orchestrates multi-source fetching (remote URLs, Base64 strings, memory buffers)
- Composes vertical Webtoon scrolls or horizontal comic strips
- Configurable gutters, alignment, padding, and background fills
─────────────────────────────────────────────────────────────────────────────
"""

import asyncio
import logging
from typing import List, Union, Optional, Literal, Dict, Any

from common.media import resolve_image_to_buffer
from .image_stitcher import stitch_images_together, stack_vertical

logger = logging.getLogger("sonikoma.features.image.stitching.merge_service")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

async def _fetch_buffer(item: Union[str, bytes]) -> bytes:
    """Resolves item to raw byte buffer."""
    if isinstance(item, (bytes, bytearray)):
        return bytes(item)
    if isinstance(item, str):
        res = await resolve_image_to_buffer(item)
        return res.get("data", b"")
    return b""


async def _resolve_all_buffers(items: List[Union[str, bytes]]) -> List[bytes]:
    """Resolves all items asynchronously in parallel."""
    tasks = [_fetch_buffer(item) for item in items]
    results = await asyncio.gather(*tasks)
    return [buf for buf in results if buf and len(buf) > 10]


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

async def merge_image_panels(
    images: List[Union[str, bytes]],
    layout: Literal["vertical", "horizontal"] = "vertical",
    spacing: int = 0,
    spacing_color: str = "white",
    align_mode: Literal["center", "start", "end"] = "center",
    padding: int = 0,
    output_format: str = "PNG",
    quality: int = 85
) -> bytes:
    """
    Fetches and stitches multiple images into a unified canvas strip.

    Args:
        images: List of image URLs, base64 data URIs, or raw bytes.
        layout: Stitching orientation ('vertical' for webtoons, 'horizontal' for strips).
        spacing: Gap between adjacent panels in pixels.
        spacing_color: Background fill color for gaps ('white', 'black', 'transparent').
        align_mode: Panel alignment across axis ('center', 'start', 'end').
        padding: Outer margin border padding in pixels.
        output_format: Output format ('PNG', 'JPEG', 'WEBP').
        quality: Compression quality for JPEG/WEBP.

    Returns:
        Stitched composite image bytes.
    """
    if not images:
        raise ValueError("Images list cannot be empty.")

    buffers = await _resolve_all_buffers(images)
    if not buffers:
        raise ValueError("Could not resolve any valid image buffers to merge.")

    return await asyncio.to_thread(
        stitch_images_together,
        image_buffers=buffers,
        layout=layout,
        spacing=spacing,
        spacing_color=spacing_color,
        align_mode=align_mode,
        padding=padding,
        output_format=output_format,
        quality=quality
    )


__all__ = [
    "merge_image_panels",
]
