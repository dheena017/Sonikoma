import uuid
import time
import asyncio
import io
import logging
from typing import Optional, Dict, Any

from PIL import Image

import services.image.utils as img_utils
from core.cache import stitched_cache, edit_history
from database.supabase.storage import upload_to_supabase_bucket

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
    content_type = resolved.get("contentType", "image/png")

    def edit_sync():
        nonlocal img_buffer, content_type
        if not img_buffer:
            return

        img = Image.open(io.BytesIO(img_buffer))

        # 1. Rotate
        if rotate and rotate != 0:
            img = img.rotate(rotate, expand=True)

        # 2. Horizontal Flip
        if flipHorizontal:
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

        # 3. Crop percentages (cropTop, cropBottom, cropLeft, cropRight are 0-100 values)
        if cropTop > 0 or cropBottom > 0 or cropLeft > 0 or cropRight > 0:
            w, h = img.size
            top_px = max(0, min(h - 1, round((cropTop / 100.0) * h)))
            bot_px = max(0, min(h - 1, round((cropBottom / 100.0) * h)))
            left_px = max(0, min(w - 1, round((cropLeft / 100.0) * w)))
            right_px = max(0, min(w - 1, round((cropRight / 100.0) * w)))

            crop_w = w - left_px - right_px
            crop_h = h - top_px - bot_px

            if crop_w >= 5 and crop_h >= 5:
                right_edge = min(w, left_px + crop_w)
                bottom_edge = min(h, top_px + crop_h)
                img = img.crop((left_px, top_px, right_edge, bottom_edge))

        # 4. Optional Auto Trim solid background margins
        if autoTrim:
            try:
                import numpy as np
                from services.image.utils.panel_image_utils import trim_solid_borders
                gray = np.array(img.convert("L"))
                tw, th = gray.shape[1], gray.shape[0]
                tx, ty, t_w, t_h = trim_solid_borders(gray, 0, 0, tw, th, backgroundColorMode)
                if t_w >= 10 and t_h >= 10:
                    img = img.crop((tx, ty, tx + t_w, ty + t_h))
            except Exception as trim_err:
                logger.warning(f"Auto-trim failed during image edit: {trim_err}")

        # 5. Optional Padding
        if padding and padding > 0:
            try:
                from PIL import ImageOps
                bg_color = (255, 255, 255) if backgroundColorMode in ('auto', 'white') else (0, 0, 0)
                img = ImageOps.expand(img, border=padding, fill=bg_color)
            except Exception as pad_err:
                logger.warning(f"Padding failed during image edit: {pad_err}")

        # 6. Format Determination & Mode Conversion
        target_fmt = (outputFormat or 'png').upper()
        if target_fmt == 'JPG':
            target_fmt = 'JPEG'

        if target_fmt in ('JPEG', 'JPG'):
            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                bg.paste(img, mask=img.split()[3])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            content_type = 'image/jpeg'
        elif target_fmt == 'WEBP':
            content_type = 'image/webp'
        else:
            target_fmt = 'PNG'
            content_type = 'image/png'

        out = io.BytesIO()
        save_kwargs = {}
        if target_fmt in ('JPEG', 'WEBP'):
            save_kwargs['quality'] = cropQuality or 90

        img.save(out, format=target_fmt, **save_kwargs)
        img_buffer = out.getvalue()

    try:
        if img_buffer:
            await asyncio.to_thread(edit_sync)
    except Exception as e:
        logger.error(f"Image edit failed: {e}", exc_info=True)

    unique_id = f"edit_{int(time.time() * 1000)}"
    try:
        filename = f"edit_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}.jpeg"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            img_buffer,
            "panels",
            filename,
            content_type
        )
    except Exception:
        supabase_url = None

    new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    try:
        stitched_cache.set(unique_id, {"data": img_buffer, "content_type": content_type})
        edit_history.set(new_url, url)
    except Exception:
        pass

    return {"success": True, "url": new_url}


async def transform_image_service(url: str, trans_type: str, value: str) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)

    try:
        if resolved["data"]:
            img = Image.open(io.BytesIO(resolved["data"]))

            if trans_type == "rotate":
                degrees = int(value)
                if degrees not in (90, -90, 180):
                    raise ValueError("Invalid rotation angle. Use 90, -90, or 180.")
                img = img.rotate(degrees, expand=True)
            elif trans_type == "flip":
                if value == "h":
                    img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                elif value == "v":
                    img = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
                else:
                    raise ValueError("Invalid flip axis. Use 'h' or 'v'.")

            if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                bg = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                bg.paste(img, mask=img.split()[3])
                img = bg
            elif img.mode != 'RGB':
                img = img.convert('RGB')

            out = io.BytesIO()
            img.save(out, format="JPEG", quality=92)
            out_bytes = out.getvalue()
        else:
            out_bytes = b""
    except Exception as e:
        logger.error(f"Image transform failed: {e}", exc_info=True)
        out_bytes = b""

    try:
        filename = f"transform_{uuid.uuid4().hex[:8]}.jpeg"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            out_bytes,
            "panels",
            filename,
            "image/jpeg"
        )
    except Exception:
        supabase_url = None

    unique_id = f"transform_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    try:
        stitched_cache.set(unique_id, {"data": out_bytes, "content_type": "image/jpeg"})
        edit_history.set(proxy_url, url)
    except Exception:
        pass

    return {"success": True, "url": proxy_url}

__all__ = [
    "apply_image_edits_service",
    "transform_image_service",
]
