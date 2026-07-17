"""
services/image/edit.py
─────────────────────────────────────────────────────────────────────────────
Pixel-level edit operations: cropping, rotation, flipping, auto-trim.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import uuid
import time
import asyncio
import logging
from typing import Optional, Dict, Any

from PIL import Image

import services.image.image_utils as img_utils
from utils.cache import stitched_cache, edit_history
from utils.supabase_storage import upload_to_supabase_bucket
from repositories.project.panels import save_edit_history

logger = logging.getLogger("sonikoma.services.image.edit")


async def apply_image_edits_service(
    url: str,
    rotate: Optional[float] = None,
    flipHorizontal: bool = False,
    cropTop: float = 0.0,
    cropBottom: float = 0.0,
    cropLeft: float = 0.0,
    cropRight: float = 0.0,
    autoTrim: bool = False,
    padding: Optional[int] = None,
    sensitivity: Optional[float] = None,
    backgroundColorMode: str = 'auto',
    aspectRatio: str = 'free',
    outputFormat: str = 'jpeg',
    cropQuality: int = 90
) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    img_buffer = resolved["data"]
    content_type = resolved["contentType"]

    def edit_sync():
        nonlocal img_buffer, content_type
        if rotate and rotate != 0:
            img = Image.open(io.BytesIO(img_buffer))
            img = img.rotate(rotate, expand=True)
            out = io.BytesIO()
            img.save(out, format=img.format or 'JPEG')
            img_buffer = out.getvalue()

        if flipHorizontal:
            img = Image.open(io.BytesIO(img_buffer))
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            out = io.BytesIO()
            img.save(out, format=img.format or 'JPEG')
            img_buffer = out.getvalue()

        if cropTop > 0 or cropBottom > 0 or cropLeft > 0 or cropRight > 0:
            img = Image.open(io.BytesIO(img_buffer))
            w, h = img.size

            top_px = int(round((cropTop / 100) * h))
            bot_px = int(round((cropBottom / 100) * h))
            left_px = int(round((cropLeft / 100) * w))
            right_px = int(round((cropRight / 100) * w))

            crop_w = w - left_px - right_px
            crop_h = h - top_px - bot_px
            if crop_w > 10 and crop_h > 10:
                img_cropped = img.crop((left_px, top_px, left_px + crop_w, top_px + crop_h))
                out = io.BytesIO()
                img_cropped.save(out, format=img.format or 'JPEG')
                img_buffer = out.getvalue()

        if autoTrim:
            trimmed = img_utils.crop_auto_borders(
                img_buffer,
                tighter=True,
                crop_padding=padding,
                sensitivity=sensitivity,
                background_color_mode=backgroundColorMode,
                aspect_ratio=aspectRatio,
                output_format=outputFormat,
                crop_quality=cropQuality
            )
            img_buffer = trimmed["data"]
            content_type = trimmed["content_type"]
        return img_buffer, content_type

    img_buffer, content_type = await asyncio.to_thread(edit_sync)

    filename = f"edited_{uuid.uuid4().hex[:8]}.jpeg" if "jpeg" in content_type or "jpg" in content_type else f"edited_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        img_buffer,
        "panels",
        filename,
        content_type
    )

    unique_id = f"merged_{int(time.time() * 1000)}_edited"
    new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
    edit_history.set(new_url, url)
    try:

        save_edit_history(new_url, url)
    except Exception:
        pass

    return {"success": True, "url": new_url}


async def transform_image_service(url: str, trans_type: str, value: str) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    img = Image.open(io.BytesIO(resolved["data"]))

    if trans_type == "rotate":
        degrees = int(value)
        if degrees not in (90, -90, 180):
            raise ValueError("Invalid rotation angle. Use 90, -90, or 180.")
        img = img.rotate(degrees, expand=True)
    elif trans_type == "flip":
        if value == "h":
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        elif value == "v":
            img = img.transpose(Image.FLIP_TOP_BOTTOM)
        else:
            raise ValueError("Invalid flip axis. Use 'h' or 'v'.")

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=92)
    out_bytes = out.getvalue()

    filename = f"transform_{uuid.uuid4().hex[:8]}.jpeg"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        out_bytes,
        "panels",
        filename,
        "image/jpeg"
    )

    unique_id = f"transform_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": out_bytes, "content_type": "image/jpeg"})
    edit_history.set(proxy_url, url)
    try:

        save_edit_history(proxy_url, url)
    except Exception:
        pass

    return {"success": True, "url": proxy_url}


__all__ = [
    "apply_image_edits_service",
    "transform_image_service",
]
