"""
backend/app/services/image/image_transform.py
─────────────────────────────────────────────────────────────────────────────
Service functions for image transformations, resizing, filters, composites,
and enhancements using PIL and ImageMagick.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import time
import uuid
import logging
import asyncio
import tempfile
from typing import Dict, Any, List, Optional
from PIL import Image

import services.image.image_utils as img_utils
from utils.cache import stitched_cache, edit_history
from utils.supabase_storage import upload_to_supabase_bucket
from media.image.imagemagick_engine import get_imagemagick_engine, ResizeMode, FilterType

logger = logging.getLogger("sonikoma.services.image.transform")

try:
    imagemagick = get_imagemagick_engine()
except ImportError as exc:
    logger.warning(f"ImageMagick engine not available: {exc}")
    imagemagick = None


def _ensure_imagemagick() -> Any:
    if imagemagick is None:
        raise ValueError("ImageMagick is not installed or not available. Install ImageMagick and wand.")
    return imagemagick


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
        from database import db
        db.save_edit_history(proxy_url, url)
    except Exception:
        pass

    return {"success": True, "url": proxy_url}


async def resize_image_service(
    image_path: str,
    output_path: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    filter_type: FilterType,
    quality: int
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.resize(image_path, out, width=width, height=height, mode=mode, filter_type=filter_type, quality=quality)
    return result


async def rotate_image_service(image_path: str, output_path: Optional[str], angle: float, background_color: str) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.rotate(image_path, out, angle=angle, background_color=background_color)
    return result


async def apply_image_enhancements_service(
    image_path: str,
    output_path: Optional[str],
    brightness: float,
    contrast: float,
    saturation: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.auto_enhance(image_path, out, brightness=brightness, contrast=contrast, saturation=saturation)
    return result


async def remove_background_service(image_path: str, output_path: Optional[str], fuzz_threshold: int) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.remove_background(image_path, out, fuzz_threshold=fuzz_threshold)
    return result


async def add_text_service(
    image_path: str,
    output_path: Optional[str],
    text: str,
    font_size: int,
    text_color: str,
    position: str,
    opacity: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.add_text_overlay(
        image_path,
        out,
        text=text,
        font_size=font_size,
        text_color=text_color,
        position=position,
        opacity=opacity
    )
    return result


async def batch_resize_service(
    image_paths: List[str],
    output_dir: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    quality: int
) -> List[str]:
    engine = _ensure_imagemagick()
    out = output_dir or os.path.join(tempfile.gettempdir(), "imagemagick_batch")
    results = await engine.batch_resize(image_paths, out, width=width, height=height, mode=mode, quality=quality)
    return results


async def composite_images_service(
    base_image_path: str,
    overlay_image_path: str,
    output_path: Optional[str],
    x: int,
    y: int,
    opacity: float
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.composite_images(
        base_image_path,
        overlay_image_path,
        out,
        x=x,
        y=y,
        opacity=opacity
    )
    return result
