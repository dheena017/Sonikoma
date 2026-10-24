"""
backend/features/image/utils/media_utils.py
─────────────────────────────────────────────────────────────────────────────
Low-Level Media Buffer & Persistence Utilities:
- Zero-copy buffer resolution from URL or base64 (via common.media)
- Grayscale average brightness calculation (0-255)
- ImageMeta metadata extraction (dimensions, channels, format, megapixels)
- Cryptographic MD5 image content fingerprinting for cache keys
- Safe persistent cache registration
─────────────────────────────────────────────────────────────────────────────
"""

import io
import os
import hashlib
import logging
from typing import Union, Dict, Any, Optional
from PIL import Image

from common.media import resolve_image_to_buffer, resolve_url_to_buffer
from common.image import compute_image_brightness
from app.core.cache import PERSISTENT_CACHE_DIR, stitched_cache

logger = logging.getLogger("sonikoma.features.image.utils.media")


# ─────────────────────────────────────────────────────────────────────────────
# 1. ImageMeta Dataclass
# ─────────────────────────────────────────────────────────────────────────────

class ImageMeta:
    """Rich image metadata container."""
    def __init__(self, width: int, height: int, format_str: str, channels: int, has_alpha: bool, size_bytes: int):
        self.width = width
        self.height = height
        self.format = format_str
        self.channels = channels
        self.hasAlpha = has_alpha
        self.sizeBytes = size_bytes

        def gcd(a: int, b: int) -> int:
            while b:
                a, b = b, a % b
            return a

        d = gcd(width, height) or 1
        self.aspectRatio = f"{width // d}:{height // d}"
        self.orientation = "landscape" if width > height else ("square" if width == height else "portrait")
        self.megapixels = round((width * height) / 1_000_000, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "format": self.format,
            "channels": self.channels,
            "hasAlpha": self.hasAlpha,
            "sizeBytes": self.sizeBytes,
            "aspectRatio": self.aspectRatio,
            "orientation": self.orientation,
            "megapixels": self.megapixels,
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Functions (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def get_image_metadata(image_bytes: bytes) -> ImageMeta:
    """Extracts dimensional, channel, and format metadata from raw image bytes."""
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    has_alpha = "A" in img.mode
    channels = len(img.getbands())
    fmt = img.format.lower() if img.format else "unknown"
    return ImageMeta(w, h, fmt, channels, has_alpha, len(image_bytes))


def fingerprint_image(image_bytes: bytes) -> str:
    """Calculates non-cryptographic MD5 digest of image bytes for cache deduplication."""
    return hashlib.md5(image_bytes, usedforsecurity=False).hexdigest()


def compute_brightness(img_data: Union[bytes, io.BytesIO]) -> float:
    """Calculates average grayscale brightness (0-255) of an image buffer."""
    if not img_data:
        return 128.0
    data_bytes = img_data.getvalue() if isinstance(img_data, io.BytesIO) else img_data
    return compute_image_brightness(data_bytes)


def save_image_to_cache(data: bytes, filename: str, content_type: str = "image/png") -> str:
    """Saves raw image bytes to persistent disk cache and registers key in stitched_cache."""
    os.makedirs(PERSISTENT_CACHE_DIR, exist_ok=True)
    out_path = os.path.join(PERSISTENT_CACHE_DIR, filename)
    with open(out_path, "wb") as f:
        f.write(data)
    try:
        stitched_cache.set(filename, {"data": data, "content_type": content_type})
    except Exception:
        pass
    return out_path


async def download_image_to_memory(url_str: str) -> bytes:
    """Resolves an image URL or base64 into raw byte data in memory."""
    res = await resolve_image_to_buffer(url_str)
    return res.get("data", b"")


__all__ = [
    "ImageMeta",
    "get_image_metadata",
    "fingerprint_image",
    "compute_brightness",
    "save_image_to_cache",
    "download_image_to_memory",
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
]
