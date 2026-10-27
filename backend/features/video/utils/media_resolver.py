"""
backend/features/video/utils/media_resolver.py
─────────────────────────────────────────────────────────────────────────────
Buffer downloads, local disk caching, and media path resolution for video.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import uuid
import base64
import logging
from typing import Optional
from PIL import Image

try:
    from database.config import MEDIA_VIDEOS_DIR, TEMP_DIR, MEDIA_DIR
except ImportError:
    MEDIA_VIDEOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "media", "videos"))
    TEMP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "temp"))
    MEDIA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "media"))

from common.media import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.features.video.utils.media_resolver")


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _decode_base64_image(b64_str: str) -> Image.Image:
    """Decodes a base64 encoded data URI or raw base64 string to a PIL Image."""
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]
    raw_bytes = base64.b64decode(b64_str)
    return Image.open(io.BytesIO(raw_bytes)).convert("RGB")


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def load_image(url_or_b64: str) -> Image.Image:
    """Loads an image from a URL, local file path, or base64 string."""
    if not url_or_b64:
        raise ValueError("Cannot resolve empty image URL or base64 data.")

    if url_or_b64.startswith("data:image/") or ";base64," in url_or_b64:
        return _decode_base64_image(url_or_b64)

    if os.path.isfile(url_or_b64):
        return Image.open(url_or_b64).convert("RGB")

    buf_meta = await resolve_image_to_buffer(url_or_b64)
    buffer = buf_meta.get("buffer")
    if buffer is None and "data" in buf_meta:
        buffer = io.BytesIO(buf_meta["data"])
    if not buffer:
        raise ValueError(f"Failed to resolve image buffer for '{url_or_b64}'")

    buffer.seek(0)
    return Image.open(buffer).convert("RGB")


def get_output_path(filename: Optional[str] = None) -> str:
    """Gets the output file path for a video in the media directory."""
    os.makedirs(MEDIA_VIDEOS_DIR, exist_ok=True)
    if not filename:
        filename = f"video-render-{uuid.uuid4().hex[:8]}.mp4"
    return os.path.join(MEDIA_VIDEOS_DIR, filename)


# Backward compatibility aliases
resolve_video_input_image = load_image
get_video_output_path = get_output_path

__all__ = [
    "MEDIA_VIDEOS_DIR",
    "TEMP_DIR",
    "MEDIA_DIR",
    "load_image",
    "get_output_path",
    "resolve_video_input_image",
    "get_video_output_path",
]
