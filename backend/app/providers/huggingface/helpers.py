"""
backend/app/providers/huggingface/helpers.py
─────────────────────────────────────────────────────────────────────────────
Image processing, buffer encoding, and prompt length trimming helpers for HF.
─────────────────────────────────────────────────────────────────────────────
"""

import io
from typing import Optional
try:
    from PIL import Image
except ImportError:
    Image = None  # type: ignore[assignment]


def trim_prompt(prompt: str, max_chars: int = 480) -> str:
    """Trim prompt to safe character boundary for HF API limits."""
    clean = " ".join(prompt.strip().split())
    return clean[:max_chars]


def encode_image_bytes(image: Image.Image, format: str = "JPEG", quality: int = 90) -> bytes:
    """Encode a PIL Image instance into compressed bytes."""
    buf = io.BytesIO()
    image.save(buf, format=format, quality=quality, optimize=True)
    return buf.getvalue()


def resize_image_if_needed(image: Image.Image, target_width: int, target_height: int) -> Image.Image:
    """Resize image with high-quality LANCZOS interpolation if dimensions differ."""
    if (image.width, image.height) != (target_width, target_height):
        return image.resize((target_width, target_height), Image.Resampling.LANCZOS)
    return image
