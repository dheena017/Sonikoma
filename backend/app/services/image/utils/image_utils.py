import io
from typing import Union
from PIL import Image, ImageStat

from .image_resolver import resolve_image_to_buffer, resolve_url_to_buffer
from app.services.image.image_stitcher import stitch_images_together, stack_vertical


def compute_brightness(img_data: Union[bytes, io.BytesIO]) -> float:
    """Calculates average grayscale brightness (0-255) of an image buffer."""
    if not img_data:
        return 128.0
    try:
        if isinstance(img_data, bytes):
            stream = io.BytesIO(img_data)
        else:
            stream = img_data
        with Image.open(stream) as img:
            grayscale = img.convert("L")
            stat = ImageStat.Stat(grayscale)
            return stat.mean[0]
    except Exception:
        return 128.0


__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    "stitch_images_together",
    "stack_vertical",
    "compute_brightness",
]


