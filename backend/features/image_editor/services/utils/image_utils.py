import io
import logging
from typing import Union, Optional, Dict, Any
from PIL import Image, ImageStat
import numpy as np

from common.media import resolve_image_to_buffer, resolve_url_to_buffer
from ..stitching.image_stitcher import stitch_images_together, stack_vertical

logger = logging.getLogger("sonikoma.services.image.utils")


async def download_image_to_memory(url_str: str) -> bytes:
    """Resolves an image URL or path into raw byte data in memory."""
    res = await resolve_image_to_buffer(url_str)
    return res.get("data", b"")



from common.image import compute_image_brightness, crop_auto_borders as common_crop_auto_borders


def compute_brightness(img_data: Union[bytes, io.BytesIO]) -> float:
    """Calculates average grayscale brightness (0-255) of an image buffer."""
    if not img_data:
        return 128.0
    data_bytes = img_data.getvalue() if isinstance(img_data, io.BytesIO) else img_data
    return compute_image_brightness(data_bytes)


def crop_auto_borders(
    img_data: bytes,
    tighter: bool = False,
    crop_padding: Optional[int] = None
) -> Dict[str, Any]:
    """
    Safely crops solid/uniform background borders (e.g. white/black margins) from an image.
    Delegates to common.image.crop_auto_borders.
    """
    return common_crop_auto_borders(img_data, tighter=tighter, crop_padding=crop_padding)


def save_image_to_cache(data: bytes, filename: str, content_type: str = "image/png") -> str:
    """
    Saves raw image bytes to the persistent cache directory and registers with cache store.
    Returns the absolute path to the saved file.
    """
    import os
    from app.core.cache import PERSISTENT_CACHE_DIR, stitched_cache
    os.makedirs(PERSISTENT_CACHE_DIR, exist_ok=True)
    out_path = os.path.join(PERSISTENT_CACHE_DIR, filename)
    with open(out_path, "wb") as f:
        f.write(data)
    try:
        stitched_cache.set(filename, {"data": data, "content_type": content_type})
    except Exception:
        pass
    return out_path


__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    "stitch_images_together",
    "stack_vertical",
    "compute_brightness",
    "crop_auto_borders",
    "save_image_to_cache",
]



