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

from PIL import Image, ImageEnhance, ImageDraw, ImageFont

from services.image.processing.imagemagick import get_imagemagick_engine, ResizeMode, FilterType

logger = logging.getLogger("sonikoma.services.image.processing.image_transformer")

try:
    _imagemagick = get_imagemagick_engine()
except (ImportError, RuntimeError, Exception) as exc:
    logger.info(f"ImageMagick dynamic C engine inactive (using Pillow/PIL fallback engine): {exc}")
    _imagemagick = None


# ── PIL Fallback Implementation ───────────────────────────────────────────────

def _pil_resize(image_path: str, output_path: str, width: Optional[int], height: Optional[int], mode: Any = ResizeMode.FIT, quality: int = 85) -> str:
    img = Image.open(image_path)
    orig_w, orig_h = img.size
    mode_str = getattr(mode, "value", str(mode))
    
    if width and height:
        if mode_str == "exact":
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        else:
            img.thumbnail((width, height), Image.Resampling.LANCZOS)
    elif width:
        ratio = width / orig_w
        img = img.resize((width, max(1, int(orig_h * ratio))), Image.Resampling.LANCZOS)
    elif height:
        ratio = height / orig_h
        img = img.resize((max(1, int(orig_w * ratio)), height), Image.Resampling.LANCZOS)
        
    img.save(output_path, quality=quality)
    return output_path


def _pil_rotate(image_path: str, output_path: str, angle: float = 0.0, background_color: str = "white") -> str:
    img = Image.open(image_path).convert("RGBA")
    rotated = img.rotate(-angle, expand=True)
    rotated.save(output_path)
    return output_path


def _pil_enhance(image_path: str, output_path: str, brightness: float = 1.0, contrast: float = 1.0, saturation: float = 1.0) -> str:
    img = Image.open(image_path)
    if brightness != 1.0:
        img = ImageEnhance.Brightness(img).enhance(brightness)
    if contrast != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast)
    if saturation != 1.0:
        img = ImageEnhance.Color(img).enhance(saturation)
    img.save(output_path)
    return output_path


def _pil_remove_bg(image_path: str, output_path: str, fuzz_threshold: int = 30) -> str:
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    if not datas:
        img.save(output_path, "PNG")
        return output_path
    bg = datas[0]
    new_data = []
    for item in datas:
        if abs(item[0] - bg[0]) < fuzz_threshold and abs(item[1] - bg[1]) < fuzz_threshold and abs(item[2] - bg[2]) < fuzz_threshold:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    img.save(output_path, "PNG")
    return output_path


def _pil_add_text(image_path: str, output_path: str, text: str = "", font_size: int = 40, text_color: str = "white", position: str = "center", opacity: float = 1.0) -> str:
    img = Image.open(image_path).convert("RGBA")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except IOError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    w, h = img.size
    if position == "center":
        x, y = (w - tw) // 2, (h - th) // 2
    elif position == "top":
        x, y = (w - tw) // 2, 20
    elif position == "bottom":
        x, y = (w - tw) // 2, h - th - 20
    else:
        x, y = 20, 20
    draw.text((x, y), text, fill=text_color, font=font)
    img.save(output_path)
    return output_path


def _pil_composite(base_image_path: str, overlay_image_path: str, output_path: str, x: int = 0, y: int = 0, opacity: float = 1.0) -> str:
    base = Image.open(base_image_path).convert("RGBA")
    overlay = Image.open(overlay_image_path).convert("RGBA")
    if opacity < 1.0:
        r, g, b, a = overlay.split()
        a = a.point(lambda p: int(p * opacity))
        overlay = Image.merge("RGBA", (r, g, b, a))
    base.paste(overlay, (x, y), overlay)
    base.save(output_path)
    return output_path


# ── Service Functions ─────────────────────────────────────────────────────────

async def resize_image_service(
    image_path: str,
    output_path: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: Optional[ResizeMode] = ResizeMode.FIT,
    filter_type: Optional[FilterType] = FilterType.LANCZOS,
    quality: Optional[int] = 85
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    if _imagemagick is not None:
        m = mode or ResizeMode.FIT
        f = filter_type or FilterType.LANCZOS
        return await _imagemagick.resize(image_path, out, width=width, height=height, mode=m, filter_type=f, quality=quality or 85)
    return _pil_resize(image_path, out, width=width, height=height, mode=mode or ResizeMode.FIT, quality=quality or 85)


async def rotate_image_service(
    image_path: str,
    output_path: Optional[str] = None,
    angle: float = 0.0,
    background_color: str = "white"
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    if _imagemagick is not None:
        return await _imagemagick.rotate(image_path, out, angle=angle, background_color=background_color)
    return _pil_rotate(image_path, out, angle=angle, background_color=background_color)


async def apply_image_enhancements_service(
    image_path: str,
    output_path: Optional[str] = None,
    brightness: Optional[float] = 1.0,
    contrast: Optional[float] = 1.0,
    saturation: Optional[float] = 1.0
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    b = brightness if brightness is not None else 1.0
    c = contrast if contrast is not None else 1.0
    s = saturation if saturation is not None else 1.0
    if _imagemagick is not None:
        return await _imagemagick.auto_enhance(image_path, out, brightness=b, contrast=c, saturation=s)
    return _pil_enhance(image_path, out, brightness=b, contrast=c, saturation=s)


async def remove_background_service(
    image_path: str,
    output_path: Optional[str] = None,
    fuzz_threshold: int = 30
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    if _imagemagick is not None:
        return await _imagemagick.remove_background(image_path, out, fuzz_threshold=fuzz_threshold)
    return _pil_remove_bg(image_path, out, fuzz_threshold=fuzz_threshold)


async def add_text_service(
    image_path: str,
    output_path: Optional[str] = None,
    text: str = "",
    font_size: int = 40,
    text_color: str = "white",
    position: str = "center",
    opacity: float = 1.0
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    if _imagemagick is not None:
        return await _imagemagick.add_text_overlay(
            image_path,
            out,
            text=text,
            font_size=font_size,
            text_color=text_color,
            position=position,
            opacity=opacity
        )
    return _pil_add_text(image_path, out, text=text, font_size=font_size, text_color=text_color, position=position, opacity=opacity)


async def batch_resize_service(
    image_paths: List[str],
    output_dir: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: Optional[ResizeMode] = ResizeMode.FIT,
    quality: int = 85
) -> List[str]:
    out = output_dir or os.path.join(tempfile.gettempdir(), "image_ops_batch")
    os.makedirs(out, exist_ok=True)
    if _imagemagick is not None:
        return await _imagemagick.batch_resize(image_paths, out, width=width, height=height, mode=mode or ResizeMode.FIT, quality=quality)
    results = []
    for ip in image_paths:
        dest = os.path.join(out, os.path.basename(ip))
        results.append(_pil_resize(ip, dest, width=width, height=height, mode=mode or ResizeMode.FIT, quality=quality))
    return results


async def composite_images_service(
    base_image_path: str,
    overlay_image_path: str,
    output_path: Optional[str] = None,
    x: int = 0,
    y: int = 0,
    opacity: float = 1.0
) -> str:
    out = output_path or os.path.join(tempfile.gettempdir(), f"image_ops_{os.urandom(4).hex()}.png")
    if _imagemagick is not None:
        return await _imagemagick.composite_images(
            base_image_path,
            overlay_image_path,
            out,
            x=x,
            y=y,
            opacity=opacity
        )
    return _pil_composite(base_image_path, overlay_image_path, out, x=x, y=y, opacity=opacity)


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

