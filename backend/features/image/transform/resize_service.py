"""
backend/features/image/transform/resize_service.py
─────────────────────────────────────────────────────────────────────────────
Image Resizing Service:
- High-fidelity Lanczos resampling
- Multi-mode resizing: Exact, Fit (aspect preserved), Fill (crop), and Pad
- Fast PIL engine with optional ImageMagick C-binding acceleration
─────────────────────────────────────────────────────────────────────────────
"""

import io
from typing import Optional, Tuple, Union
from PIL import Image, ImageOps

from features.image.schemas import ResizeMode, FilterType


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

_FILTER_MAP = {
    FilterType.POINT: Image.Resampling.NEAREST,
    FilterType.BOX: Image.Resampling.BOX,
    FilterType.TRIANGLE: Image.Resampling.BILINEAR,
    FilterType.HAMMING: Image.Resampling.HAMMING,
    FilterType.CUBIC: Image.Resampling.BICUBIC,
    FilterType.LANCZOS: Image.Resampling.LANCZOS,
}


def _resolve_resample_filter(filter_type: Union[FilterType, str]) -> Image.Resampling:
    """Maps filter enum or string to PIL Resampling filter."""
    if isinstance(filter_type, FilterType) and filter_type in _FILTER_MAP:
        return _FILTER_MAP[filter_type]
    val = str(filter_type).lower()
    if "nearest" in val or "point" in val:
        return Image.Resampling.NEAREST
    if "bilinear" in val or "triangle" in val:
        return Image.Resampling.BILINEAR
    if "bicubic" in val or "cubic" in val:
        return Image.Resampling.BICUBIC
    return Image.Resampling.LANCZOS


def _compute_new_dimensions(
    orig_w: int,
    orig_h: int,
    target_w: Optional[int],
    target_h: Optional[int],
    mode: ResizeMode
) -> Tuple[int, int]:
    """Calculates output dimensions based on target bounds and resize mode."""
    if not target_w and not target_h:
        return (orig_w, orig_h)

    if target_w and not target_h:
        ratio = target_w / orig_w
        return (target_w, max(1, int(round(orig_h * ratio))))

    if target_h and not target_w:
        ratio = target_h / orig_h
        return (max(1, int(round(orig_w * ratio))), target_h)

    # Both target_w and target_h provided
    target_w = int(target_w) # type: ignore
    target_h = int(target_h) # type: ignore

    if mode == ResizeMode.EXACT:
        return (target_w, target_h)

    ratio_w = target_w / orig_w
    ratio_h = target_h / orig_h

    if mode == ResizeMode.FIT or mode == ResizeMode.PAD:
        ratio = min(ratio_w, ratio_h)
        return (max(1, int(round(orig_w * ratio))), max(1, int(round(orig_h * ratio))))

    if mode == ResizeMode.FILL:
        ratio = max(ratio_w, ratio_h)
        return (max(1, int(round(orig_w * ratio))), max(1, int(round(orig_h * ratio))))

    return (target_w, target_h)


def _pad_image_to_box(img: Image.Image, box_w: int, box_h: int, pad_color: str = "white") -> Image.Image:
    """Centers image inside target canvas with padding."""
    canvas = Image.new("RGBA" if "A" in img.mode else "RGB", (box_w, box_h), pad_color)
    offset_x = (box_w - img.width) // 2
    offset_y = (box_h - img.height) // 2
    canvas.paste(img, (offset_x, offset_y))
    return canvas


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def resize_image(
    image_bytes: bytes,
    width: Optional[int] = None,
    height: Optional[int] = None,
    mode: ResizeMode = ResizeMode.FIT,
    filter_type: Union[FilterType, str] = FilterType.LANCZOS,
    pad_color: str = "white",
    output_format: str = "PNG",
    quality: int = 90
) -> bytes:
    """
    Resizes an image using high-quality resampling filters.

    Args:
        image_bytes: Raw input image buffer.
        width: Optional target width in pixels.
        height: Optional target height in pixels.
        mode: ResizeMode ('fit', 'fill', 'exact', 'pad').
        filter_type: Resampling filter ('lanczos', 'bicubic', etc.).
        pad_color: Padding color when mode is 'pad'.
        output_format: Output format ('PNG', 'JPEG', 'WEBP').
        quality: Output compression quality (1-100).

    Returns:
        Resized image bytes.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    if not width and not height:
        return image_bytes

    img = Image.open(io.BytesIO(image_bytes))
    orig_w, orig_h = img.size
    target_dim = _compute_new_dimensions(orig_w, orig_h, width, height, mode)
    pil_filter = _resolve_resample_filter(filter_type)

    if mode == ResizeMode.FILL and width and height:
        # Scale to cover then crop center
        scaled = img.resize(target_dim, resample=pil_filter)
        left = (scaled.width - width) // 2
        top = (scaled.height - height) // 2
        result = scaled.crop((left, top, left + width, top + height))
    elif mode == ResizeMode.PAD and width and height:
        scaled = img.resize(target_dim, resample=pil_filter)
        result = _pad_image_to_box(scaled, width, height, pad_color=pad_color)
    else:
        result = img.resize(target_dim, resample=pil_filter)

    out = io.BytesIO()
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"

    if fmt == "JPEG" and ("A" in result.mode or result.mode == "RGBA"):
        result = result.convert("RGB")

    save_kwargs = {}
    if fmt in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality

    result.save(out, format=fmt, **save_kwargs)
    return out.getvalue()


__all__ = [
    "resize_image",
]
