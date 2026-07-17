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


async def transform_image_service(
    url: str,
    scale_x: float = 1.0,
    scale_y: float = 1.0,
    rotation: float = 0.0,
    flip_h: bool = False,
    flip_v: bool = False,
    quality: int = 90,
    format_str: str = "jpeg"
) -> Dict[str, Any]:
    """Applies geometric transforms (scaling, rotation, flip) to an image buffer."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    
    def transform_sync():
        img = Image.open(io.BytesIO(resolved["data"]))
        
        # Scaling
        if scale_x != 1.0 or scale_y != 1.0:
            new_w = int(max(10, img.width * scale_x))
            new_h = int(max(10, img.height * scale_y))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        # Rotation
        if rotation != 0.0:
            img = img.rotate(rotation, expand=True)
            
        # Flips
        if flip_h:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        if flip_v:
            img = img.transpose(Image.FLIP_TOP_BOTTOM)
            
        out = io.BytesIO()
        fmt = format_str.upper()
        if fmt == "JPG":
            fmt = "JPEG"
        if fmt == "JPEG" and img.mode in ("RGBA", "LA"):
            img = img.convert("RGB")
            
        img.save(out, format=fmt, quality=quality)
        return out.getvalue()

    out_bytes = await asyncio.to_thread(transform_sync)
    content_type = f"image/{format_str.lower()}"
    if format_str.lower() == "jpg":
        content_type = "image/jpeg"

    filename = f"transform_{uuid.uuid4().hex[:8]}.{format_str.lower()}"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        out_bytes,
        "panels",
        filename,
        content_type
    )

    unique_id = f"transform_{int(time.time() * 1000)}"
    proxy_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    stitched_cache.set(unique_id, {"data": out_bytes, "content_type": content_type})
    edit_history.set(proxy_url, url)
    try:
        from database import db
        db.save_edit_history(proxy_url, url)
    except Exception:
        pass

    return {"success": True, "url": proxy_url}


async def resize_image_service(
    image_path: str,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: ResizeMode = ResizeMode.FIT,
    filter_type: FilterType = FilterType.LANCZOS,
    quality: int = 85
) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(
        engine.resize, image_path, width, height, mode, filter_type, quality
    )


async def rotate_image_service(
    image_path: str,
    angle: float,
    background_color: str = "white"
) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.rotate, image_path, angle, background_color)


async def apply_image_enhancements_service(
    image_path: str,
    brightness: float = 1.0,
    contrast: float = 1.0,
    saturation: float = 1.0
) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.enhance, image_path, brightness, contrast, saturation)


async def remove_background_service(image_path: str, fuzz_threshold: int = 30) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.remove_background, image_path, fuzz_threshold)


async def add_text_service(
    image_path: str,
    text: str,
    font_size: int = 40,
    text_color: str = "white",
    position: str = "center",
    opacity: float = 1.0
) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.add_text, image_path, text, font_size, text_color, position, opacity)


async def batch_resize_service(
    image_paths: List[str],
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: ResizeMode = ResizeMode.FIT
) -> List[str]:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.batch_resize, image_paths, width, height, mode)


async def composite_images_service(
    base_image_path: str,
    overlay_image_path: str,
    x: int = 0,
    y: int = 0,
    opacity: float = 1.0
) -> str:
    engine = _ensure_imagemagick()
    return await asyncio.to_thread(engine.composite, base_image_path, overlay_image_path, x, y, opacity)
