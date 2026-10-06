"""
Moved image_ops into services.image.processing
"""

import io
import logging
import hashlib
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.image.image_ops")


class ImageMeta:
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
        self.orientation = 'landscape' if width > height else ('square' if width == height else 'portrait')
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
            "megapixels": self.megapixels
        }


def get_image_meta(image_bytes: bytes) -> ImageMeta:
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    has_alpha = 'A' in img.mode
    channels = len(img.getbands())
    fmt = img.format.lower() if img.format else 'unknown'
    return ImageMeta(w, h, fmt, channels, has_alpha, len(image_bytes))

def fingerprint_image(image_bytes: bytes) -> str:
    return hashlib.md5(image_bytes, usedforsecurity=False).hexdigest()

# ... other functions preserved from original image_ops
