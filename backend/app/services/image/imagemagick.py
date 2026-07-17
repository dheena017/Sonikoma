"""
services/image/imagemagick.py
─────────────────────────────────────────────────────────────────────────────
ImageMagick-specific image transformation operations (resize, rotate, enhance, etc.)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from typing import List, Optional, Any

from providers.media.imagemagick import get_imagemagick_engine, ResizeMode, FilterType

logger = logging.getLogger("sonikoma.services.image.imagemagick")

try:
    imagemagick = get_imagemagick_engine()
except ImportError as exc:
    logger.warning(f"ImageMagick engine not available in service layer: {exc}")
    imagemagick = None


def _ensure_imagemagick() -> Any:
    if imagemagick is None:
        raise ValueError("ImageMagick is not installed or not available. Install ImageMagick and wand.")
    return imagemagick


async def resize_image_service(
    image_path: str,
    output_path: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    filter_type: FilterType,
    quality: int,
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
    saturation: float,
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
    opacity: float,
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
        opacity=opacity,
    )
    return result


async def batch_resize_service(
    image_paths: List[str],
    output_dir: Optional[str],
    width: Optional[int],
    height: Optional[int],
    mode: ResizeMode,
    quality: int,
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
    opacity: float,
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    result = await engine.composite_images(
        base_image_path,
        overlay_image_path,
        out,
        x=x,
        y=y,
        opacity=opacity,
    )
    return result
