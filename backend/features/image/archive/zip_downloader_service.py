"""
backend/features/image/archive/zip_downloader_service.py
─────────────────────────────────────────────────────────────────────────────
Zip Downloader Service:
- Concurrent asynchronous downloading of image panels from remote URLs
- Bundles images into an in-memory zip archive with normalized sequence naming
─────────────────────────────────────────────────────────────────────────────
"""

import io
import zipfile
import asyncio
import logging
from typing import List, Dict, Any, Tuple, Optional
from common.media import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.features.image.archive.zip_downloader")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

async def _fetch_single_image(
    url: str,
    index: int,
    referer: Optional[str] = None
) -> Tuple[int, bytes, str]:
    """Fetches image buffer from URL or base64."""
    try:
        res = await resolve_image_to_buffer(url, referer=referer)
        data = res.get("data", b"")
        ctype = res.get("content_type", "image/png")
        return (index, data, ctype)
    except Exception as exc:
        logger.warning(f"Failed to fetch image at index {index} ({url}): {exc}")
        return (index, b"", "image/png")


def _get_extension(content_type: str) -> str:
    """Extracts extension string from content-type."""
    ct = content_type.lower()
    if "jpeg" in ct or "jpg" in ct:
        return "jpg"
    elif "webp" in ct:
        return "webp"
    elif "avif" in ct:
        return "avif"
    return "png"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

async def download_and_bundle_zip(
    image_urls: List[str],
    prefix: str = "panel",
    referer: Optional[str] = None,
) -> bytes:
    """
    Downloads images from URLs concurrently and packages them into a zip archive.

    Args:
        image_urls: List of image URLs or base64 data URIs.
        prefix: Filename prefix for items in the archive (e.g. 'panel' -> 'panel_001.png').
        referer: Optional HTTP Referer for CDN bypass.

    Returns:
        Raw zip archive bytes.
    """
    if not image_urls:
        raise ValueError("Image URLs list cannot be empty.")

    tasks = [_fetch_single_image(url, idx, referer=referer) for idx, url in enumerate(image_urls)]
    results = await asyncio.gather(*tasks)

    # Sort back into original requested order
    results.sort(key=lambda x: x[0])

    valid_results = [r for r in results if r[1] and len(r[1]) > 0]
    if not valid_results:
        raise ValueError("Failed to retrieve any valid image data from the provided URLs.")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, data, ctype in results:
            if not data:
                continue
            ext = _get_extension(ctype)
            filename = f"images/{prefix}_{idx + 1:03d}.{ext}"
            zf.writestr(filename, data)

    buffer.seek(0)
    return buffer.getvalue()


__all__ = [
    "download_and_bundle_zip",
]
