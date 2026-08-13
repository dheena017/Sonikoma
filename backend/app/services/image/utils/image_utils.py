import io
import logging
from typing import Union, Optional, Dict, Any
from PIL import Image, ImageStat
import numpy as np

from .image_resolver import resolve_image_to_buffer, resolve_url_to_buffer
from ..stitching.image_stitcher import stitch_images_together, stack_vertical

logger = logging.getLogger("sonikoma.services.image.utils")


async def download_image_to_memory(url_str: str) -> bytes:
    """Resolves an image URL or path into raw byte data in memory."""
    res = await resolve_image_to_buffer(url_str)
    return res.get("data", b"")



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
    Safely crops solid/uniform background borders (e.g. white/black margins) from an image.
    Designed to prevent over-cropping webtoons, panel strips, and full episode images.
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

            w, h = img.size
            if h < 30 or w < 30:
                return {"data": img_data, "content_type": content_type}

            converted = img.convert("RGB")
            arr = np.array(converted)

            # Check if outer border is low variance / solid color
            top_strip = arr[:5, :, :]
            bottom_strip = arr[-5:, :, :]
            left_strip = arr[:, :5, :]
            right_strip = arr[:, :, -5:]

            top_std = float(np.std(top_strip))
            bottom_std = float(np.std(bottom_strip))
            left_std = float(np.std(left_strip))
            right_std = float(np.std(right_strip))

            max_border_std = 18.0 if not tighter else 30.0

            top_bg = np.median(top_strip.reshape(-1, 3), axis=0) if top_std < max_border_std else None
            bottom_bg = np.median(bottom_strip.reshape(-1, 3), axis=0) if bottom_std < max_border_std else None
            left_bg = np.median(left_strip.reshape(-1, 3), axis=0) if left_std < max_border_std else None
            right_bg = np.median(right_strip.reshape(-1, 3), axis=0) if right_std < max_border_std else None

            logger.debug(
                f"[AutoCrop Borders] Evaluating ({w}x{h}), tighter={tighter}, pad={crop_padding}, "
                f"border_stds=(top={top_std:.1f}, bot={bottom_std:.1f}, left={left_std:.1f}, right={right_std:.1f})"
            )

            if top_bg is None and bottom_bg is None and left_bg is None and right_bg is None:
                logger.debug(f"[AutoCrop Borders] No uniform solid borders detected on image edges ({w}x{h}); keeping original.")
                return {"data": img_data, "content_type": content_type}

            y_min, y_max = 0, h
            x_min, x_max = 0, w

            threshold = 15.0 if tighter else 25.0

            if top_bg is not None:
                diff_top = np.max(np.abs(arr.astype(float) - top_bg), axis=2)
                row_has_content = np.any(diff_top > threshold, axis=1)
                content_rows = np.where(row_has_content)[0]
                if len(content_rows) > 0:
                    y_min = int(content_rows[0])

            if bottom_bg is not None:
                diff_bot = np.max(np.abs(arr.astype(float) - bottom_bg), axis=2)
                row_has_content = np.any(diff_bot > threshold, axis=1)
                content_rows = np.where(row_has_content)[0]
                if len(content_rows) > 0:
                    y_max = int(content_rows[-1]) + 1

            if left_bg is not None:
                diff_left = np.max(np.abs(arr.astype(float) - left_bg), axis=2)
                col_has_content = np.any(diff_left > threshold, axis=0)
                content_cols = np.where(col_has_content)[0]
                if len(content_cols) > 0:
                    x_min = int(content_cols[0])

            if right_bg is not None:
                diff_right = np.max(np.abs(arr.astype(float) - right_bg), axis=2)
                col_has_content = np.any(diff_right > threshold, axis=0)
                content_cols = np.where(col_has_content)[0]
                if len(content_cols) > 0:
                    x_max = int(content_cols[-1]) + 1

            # Safety cap: never crop more than 12% (or 20% if tighter) of any dimension
            max_crop_pct = 0.20 if tighter else 0.12
            max_crop_x = int(w * max_crop_pct)
            max_crop_y = int(h * max_crop_pct)

            x_min = min(x_min, max_crop_x)
            y_min = min(y_min, max_crop_y)
            x_max = max(x_max, w - max_crop_x)
            y_max = max(y_max, h - max_crop_y)

            pad = crop_padding if crop_padding is not None else 0
            if pad > 0:
                x_min = max(0, x_min - pad)
                y_min = max(0, y_min - pad)
                x_max = min(w, x_max + pad)
                y_max = min(h, y_max + pad)

            if (x_max - x_min) >= 30 and (y_max - y_min) >= 30:
                if x_min > 0 or y_min > 0 or x_max < w or y_max < h:
                    logger.debug(f"[AutoCrop Borders] Cropped margins: ({w}x{h}) -> crop_box=({x_min},{y_min},{x_max-x_min}x{y_max-y_min})")
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



