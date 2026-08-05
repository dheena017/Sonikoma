"""
backend/app/services/image/magick_processor.py
─────────────────────────────────────────────────────────────────────────────
ImageMagick-backed operations: resize, rotate, enhance, background removal,
text overlay, batch resize, and image compositing.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import tempfile
import logging
from typing import List, Optional, Any

from providers.media.imagemagick import get_imagemagick_engine, ResizeMode, FilterType

logger = logging.getLogger("sonikoma.services.image.magick_processor")

try:
    _imagemagick = get_imagemagick_engine()
except ImportError as exc:
    logger.warning(f"ImageMagick engine not available in service layer: {exc}")
    _imagemagick = None


def _ensure_imagemagick() -> Any:
    """Raise a clear error when ImageMagick is unavailable."""
    if _imagemagick is None:
        raise ValueError(
            "ImageMagick is not installed or not available. "
            "Install ImageMagick and the `wand` Python package."
        )
    return _imagemagick


async def resize_image_service(
    image_path: str,
    output_path: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: Optional[ResizeMode] = ResizeMode.FIT,
    filter_type: Optional[FilterType] = FilterType.LANCZOS,
    quality: Optional[int] = 85
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    m = mode or ResizeMode.FIT
    f = filter_type or FilterType.LANCZOS
    return await engine.resize(image_path, out, width=width, height=height, mode=m, filter_type=f, quality=quality)


async def rotate_image_service(
    image_path: str,
    output_path: Optional[str] = None,
    angle: float = 0.0,
    background_color: str = "white"
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    return await engine.rotate(image_path, out, angle=angle, background_color=background_color)


async def apply_image_enhancements_service(
    image_path: str,
    output_path: Optional[str] = None,
    brightness: Optional[float] = 1.0,
    contrast: Optional[float] = 1.0,
    saturation: Optional[float] = 1.0
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    b = brightness if brightness is not None else 1.0
    c = contrast if contrast is not None else 1.0
    s = saturation if saturation is not None else 1.0
    return await engine.auto_enhance(image_path, out, brightness=b, contrast=c, saturation=s)


async def remove_background_service(
    image_path: str,
    output_path: Optional[str] = None,
    fuzz_threshold: int = 30
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    return await engine.remove_background(image_path, out, fuzz_threshold=fuzz_threshold)


async def add_text_service(
    image_path: str,
    output_path: Optional[str] = None,
    text: str = "",
    font_size: int = 40,
    text_color: str = "white",
    position: str = "center",
    opacity: float = 1.0
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    return await engine.add_text_overlay(
        image_path,
        out,
        text=text,
        font_size=font_size,
        text_color=text_color,
        position=position,
        opacity=opacity
    )


async def batch_resize_service(
    image_paths: List[str],
    output_dir: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: Optional[ResizeMode] = ResizeMode.FIT,
    quality: int = 85
) -> List[str]:
    engine = _ensure_imagemagick()
    out = output_dir or os.path.join(tempfile.gettempdir(), "imagemagick_batch")
    return await engine.batch_resize(image_paths, out, width=width, height=height, mode=mode or ResizeMode.FIT, quality=quality)


async def composite_images_service(
    base_image_path: str,
    overlay_image_path: str,
    output_path: Optional[str] = None,
    x: int = 0,
    y: int = 0,
    opacity: float = 1.0
) -> str:
    engine = _ensure_imagemagick()
    out = output_path or os.path.join(tempfile.gettempdir(), f"imagemagick_{os.urandom(4).hex()}.png")
    return await engine.composite_images(
        base_image_path,
        overlay_image_path,
        out,
        x=x,
        y=y,
        opacity=opacity
    )


# Human-readable aliases
resize_image = resize_image_service
rotate_image = rotate_image_service
enhance_image_quality = apply_image_enhancements_service
remove_image_background = remove_background_service
overlay_text_on_image = add_text_service

__all__ = [
    # Human-readable function names
    "resize_image",
    "rotate_image",
    "enhance_image_quality",
    "remove_image_background",
    "overlay_text_on_image",
    # Original service names
    "resize_image_service",
    "rotate_image_service",
    "apply_image_enhancements_service",
    "remove_background_service",
    "add_text_service",
    "batch_resize_service",
    "composite_images_service",
    "ResizeMode",
    "FilterType",
]

