import io
import logging
from typing import Union, Optional, Dict, Any
from PIL import Image, ImageStat
import numpy as np

from .image_resolver import resolve_image_to_buffer, resolve_url_to_buffer
from ..image_stitcher import stitch_images_together, stack_vertical

logger = logging.getLogger("sonikoma.services.image.utils")


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


def crop_auto_borders(
    img_data: bytes,
    tighter: bool = False,
    crop_padding: Optional[int] = None
) -> Dict[str, Any]:
    """
    Automatically detects and crops solid/uniform borders (e.g. white/black margins)
    from an image buffer.
    """
    if not img_data:
        return {"data": img_data, "content_type": "image/jpeg"}

    try:
        with Image.open(io.BytesIO(img_data)) as img:
            orig_format = img.format or "JPEG"
            fmt_lower = orig_format.lower()
            if fmt_lower in ("jpeg", "jpg"):
                content_type = "image/jpeg"
            elif fmt_lower == "png":
                content_type = "image/png"
            elif fmt_lower == "webp":
                content_type = "image/webp"
            else:
                content_type = f"image/{fmt_lower}"

            converted = img.convert("RGB")
            arr = np.array(converted)

            h, w, _ = arr.shape
            if h < 20 or w < 20:
                return {"data": img_data, "content_type": content_type}

            # Sample corners to determine background color
            corners = np.concatenate([
                arr[:5, :5].reshape(-1, 3),
                arr[:5, -5:].reshape(-1, 3),
                arr[-5:, :5].reshape(-1, 3),
                arr[-5:, -5:].reshape(-1, 3),
            ], axis=0)
            bg_color = np.median(corners, axis=0)

            # Measure channel difference from estimated background color
            diff = np.abs(arr.astype(float) - bg_color)
            dist = np.max(diff, axis=2)

            # Threshold: tighter mode uses lower threshold to crop aggressively
            threshold = 12.0 if tighter else 25.0
            content_mask = dist > threshold

            coords = np.argwhere(content_mask)
            if coords.size == 0:
                return {"data": img_data, "content_type": content_type}

            y_min, x_min = coords.min(axis=0)
            y_max, x_max = coords.max(axis=0) + 1

            # Apply padding if requested
            pad = crop_padding if crop_padding is not None else 0
            if pad > 0:
                x_min = max(0, x_min - pad)
                y_min = max(0, y_min - pad)
                x_max = min(w, x_max + pad)
                y_max = min(h, y_max + pad)

            if x_min < x_max and y_min < y_max and (x_min > 0 or y_min > 0 or x_max < w or y_max < h):
                cropped_img = img.crop((x_min, y_min, x_max, y_max))
                out = io.BytesIO()
                cropped_img.save(out, format=orig_format, quality=95)
                return {"data": out.getvalue(), "content_type": content_type}

            return {"data": img_data, "content_type": content_type}
    except Exception as e:
        logger.warning(f"crop_auto_borders failed: {e}")
        return {"data": img_data, "content_type": "image/jpeg"}


__all__ = [
    "resolve_image_to_buffer",
    "resolve_url_to_buffer",
    "stitch_images_together",
    "stack_vertical",
    "compute_brightness",
    "crop_auto_borders",
]



