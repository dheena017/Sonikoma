"""
backend/features/ai/utils/image_loader.py
─────────────────────────────────────────────────────────────────────────────
Safely loads base64 strings, file paths, and bytes into PIL Image objects.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import os
import base64
from typing import Union
from PIL import Image


# ── Internal Helpers ─────────────────────────────────────────────────────────

def _decode_base64_payload(payload: str) -> bytes:
    """Strips data:image/png;base64, headers and decodes raw bytes."""
    data = payload.strip()
    if "," in data:
        data = data.split(",", 1)[1]
    return base64.b64decode(data)


def _load_from_bytes(data: bytes) -> Image.Image:
    """Loads image from raw byte buffer, converting to RGB for safety."""
    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    return img


# ── Public API ───────────────────────────────────────────────────────────────

def load_picture(picture_input: Union[str, bytes, Image.Image]) -> Image.Image:
    """Safely loads base64 strings, raw bytes, or disk paths into a clean PIL Image."""
    if isinstance(picture_input, Image.Image):
        return picture_input

    if isinstance(picture_input, bytes):
        return _load_from_bytes(picture_input)

    if isinstance(picture_input, str):
        if picture_input.startswith("data:image") or len(picture_input) > 500:
            raw_bytes = _decode_base64_payload(picture_input)
            return _load_from_bytes(raw_bytes)
        elif os.path.isfile(picture_input):
            with open(picture_input, "rb") as f:
                return _load_from_bytes(f.read())

    raise ValueError(f"Cannot load picture from input type: {type(picture_input)}")


__all__ = ["load_picture"]
