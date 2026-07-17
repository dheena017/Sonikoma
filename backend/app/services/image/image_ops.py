"""
backend/app/services/image/image_ops.py
─────────────────────────────────────────────────────────────────────────────
Core image manipulation: resizing, watermarks, filters, format conversions,
thumbnails, background sampling, brightness, and auto-cropping.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
import hashlib
import numpy as np
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from typing import Dict, Any, Optional

logger = logging.getLogger("sonikoma.services.image.image_ops")


class ImageMeta:
    def __init__(self, width: int, height: int, format_str: str, channels: int, has_alpha: bool, size_bytes: int):
        self.width = width
        self.height = height
        self.format = format_str
        self.channels = channels
        self.hasAlpha = has_alpha
        self.sizeBytes = size_bytes

        def gcd(a: int, b: int) -> int:
            while b:
                a, b = b, a % b
            return a

        d = gcd(width, height) or 1
        self.aspectRatio = f"{width // d}:{height // d}"
        self.orientation = 'landscape' if width > height else ('square' if width == height else 'portrait')
        self.megapixels = round((width * height) / 1_000_000, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "width": self.width,
            "height": self.height,
            "format": self.format,
            "channels": self.channels,
            "hasAlpha": self.hasAlpha,
            "sizeBytes": self.sizeBytes,
            "aspectRatio": self.aspectRatio,
            "orientation": self.orientation,
            "megapixels": self.megapixels
        }


def get_image_meta(image_bytes: bytes) -> ImageMeta:
    """Extract metadata from image bytes without reading full image into memory (using PIL metadata only)."""
    img = Image.open(io.BytesIO(image_bytes))
    w, h = img.size
    has_alpha = 'A' in img.mode
    channels = len(img.getbands())
    fmt = img.format.lower() if img.format else 'unknown'
    return ImageMeta(w, h, fmt, channels, has_alpha, len(image_bytes))


def fingerprint_image(image_bytes: bytes) -> str:
    """Generate MD5 fingerprint of image bytes."""
    return hashlib.md5(image_bytes).hexdigest()


def convert_format(image_bytes: bytes, output_format: str = 'jpeg', quality: int = 90) -> Dict[str, Any]:
    """Convert image bytes to target format with quality control."""
    img = Image.open(io.BytesIO(image_bytes))
    fmt = output_format.upper()
    if fmt == 'JPG':
        fmt = 'JPEG'

    out = io.BytesIO()
    if fmt == 'JPEG' and img.mode in ('RGBA', 'LA'):
        img = img.convert('RGB')

    img.save(out, format=fmt, quality=quality)
    mime = f"image/{output_format.lower()}"
    if output_format.lower() == 'jpg':
        mime = 'image/jpeg'

    return {"data": out.getvalue(), "content_type": mime}


def resize_fit(image_bytes: bytes, max_w: int, max_h: int, output_format: str = 'jpeg', quality: int = 88) -> Dict[str, Any]:
    """Resize image to fit within max_w x max_h while preserving aspect ratio."""
    img = Image.open(io.BytesIO(image_bytes))
    img.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    fmt = output_format.upper()
    if fmt == 'JPG':
        fmt = 'JPEG'
    if fmt == 'JPEG' and img.mode in ('RGBA', 'LA'):
        img = img.convert('RGB')

    img.save(out, format=fmt, quality=quality)
    mime = f"image/{output_format.lower()}"
    if output_format.lower() == 'jpg':
        mime = 'image/jpeg'

    return {"data": out.getvalue(), "content_type": mime}


def make_thumbnail(image_bytes: bytes, size: int = 256) -> bytes:
    """Generate a high speed thumbnail (JPEG)."""
    img = Image.open(io.BytesIO(image_bytes))

    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img_cropped = img.crop((left, top, left + min_dim, top + min_dim))

    img_cropped.thumbnail((size, size), Image.Resampling.LANCZOS)
    out = io.BytesIO()
    img_cropped.convert('RGB').save(out, format='JPEG', quality=70)
    return out.getvalue()


def crop_auto_borders(
    image_bytes: bytes,
    tighter: bool = False,
    crop_padding: Optional[int] = None,
    sensitivity: Optional[float] = None,
    background_color_mode: str = 'auto',
    aspect_ratio: str = 'free',
    output_format: str = 'jpeg',
    crop_quality: int = 90
) -> Dict[str, Any]:
    """Auto crops uniform margins (whitespace/black gutters) using pixel-by-pixel content snapping analysis."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size

        if w < 10 or h < 10:
            return {"data": image_bytes, "content_type": f"image/{img.format.lower() if img.format else 'jpeg'}"}

        gray = np.array(img.convert('L'))

        if background_color_mode == 'white':
            bg_val = 255.0
            bg_color = (255, 255, 255)
        elif background_color_mode == 'black':
            bg_val = 0.0
            bg_color = (0, 0, 0)
        else:
            corners = np.concatenate([
                gray[:3, :3].flatten(),
                gray[-3:, :3].flatten(),
                gray[:3, -3:].flatten(),
                gray[-3:, -3:].flatten()
            ])
            bg_val = np.median(corners) if len(corners) > 0 else 255.0

            img_rgb_sample = img.convert('RGB')
            corner_pixels = [
                img_rgb_sample.getpixel((0, 0)),
                img_rgb_sample.getpixel((w - 1, 0)),
                img_rgb_sample.getpixel((0, h - 1)),
                img_rgb_sample.getpixel((w - 1, h - 1))
            ]
            avg_r = int(np.mean([c[0] for c in corner_pixels]))
            avg_g = int(np.mean([c[1] for c in corner_pixels]))
            avg_b = int(np.mean([c[2] for c in corner_pixels]))
            bg_color = (avg_r, avg_g, avg_b)

        tol = sensitivity if sensitivity is not None else (15.0 if tighter else 20.0)
        if bg_val >= 200.0:
            content_mask = (gray < (255.0 - tol))
        elif bg_val <= 55.0:
            content_mask = (gray > tol)
        else:
            content_mask = (np.abs(gray.astype(float) - bg_val) > tol)

        try:
            import cv2
            kernel = np.ones((2, 2), dtype=np.uint8)
            content_mask_cleaned = cv2.morphologyEx(content_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        except ImportError:
            content_mask_cleaned = content_mask.astype(np.uint8)

        if not np.any(content_mask_cleaned > 0):
            content_mask_cleaned = content_mask.astype(np.uint8)

        row_sums = np.sum(content_mask_cleaned > 0, axis=1)
        col_sums = np.sum(content_mask_cleaned > 0, axis=0)

        row_indices = np.where(row_sums >= 1)[0]
        col_indices = np.where(col_sums >= 1)[0]

        if len(row_indices) > 0 and len(col_indices) > 0:
            left = int(col_indices[0])
            top = int(row_indices[0])
            right = int(col_indices[-1]) + 1
            bottom = int(row_indices[-1]) + 1

            if (right - left) >= 10 and (bottom - top) >= 10:
                trimmed = img.crop((left, top, right, bottom))
            else:
                trimmed = img
        else:
            trimmed = img

        tw, th = trimmed.size
        padding = crop_padding if crop_padding is not None else (4 if tighter else 20)
        e_l = e_r = e_t = e_b = padding

        if aspect_ratio and aspect_ratio != 'free':
            ratio_map = {'1:1': 1.0, '16:9': 16.0 / 9.0, '9:16': 9.0 / 16.0, '4:3': 4.0 / 3.0}
            target = ratio_map.get(aspect_ratio)
            if target:
                b_w = tw + padding * 2
                b_h = th + padding * 2
                cr = b_w / b_h
                if cr < target:
                    extra = int(b_h * target) - b_w
                    e_l += extra // 2
                    e_r += extra - (extra // 2)
                elif cr > target:
                    extra = int(b_w / target) - b_h
                    e_t += extra // 2
                    e_b += extra - (extra // 2)

        if img.mode == 'RGBA':
            bg_color_mode = bg_color + (255,)
        elif img.mode == 'LA':
            lum = int(0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2])
            bg_color_mode = (lum, 255)
        elif img.mode == 'L':
            lum = int(0.299 * bg_color[0] + 0.587 * bg_color[1] + 0.114 * bg_color[2])
            bg_color_mode = lum
        else:
            bg_color_mode = bg_color

        extended = ImageOps.expand(trimmed, border=(e_l, e_t, e_r, e_b), fill=bg_color_mode)

        out = io.BytesIO()
        fmt = output_format.upper()
        if fmt == 'JPG':
            fmt = 'JPEG'

        if fmt == 'JPEG' and extended.mode in ('RGBA', 'LA'):
            extended = extended.convert('RGB')

        extended.save(out, format=fmt, quality=crop_quality)
        mime = f"image/{output_format.lower()}"
        if output_format.lower() == 'jpg':
            mime = 'image/jpeg'

        logger.info(f"[Image Ops] Auto-trim successful. New size: {extended.size[0]}x{extended.size[1]}")
        return {"data": out.getvalue(), "content_type": mime}
    except Exception as e:
        logger.error(f"[Image Ops] crop_auto_borders failed: {e}")
        return {"data": image_bytes, "content_type": "image/jpeg"}


def sample_background_color(image_bytes: bytes) -> Dict[str, Any]:
    """Sample background color and determine dark mode setting."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size
        corner = img.crop((0, 0, min(16, w), min(16, h))).resize((1, 1))
        r, g, b = corner.getpixel((0, 0))
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        lum = 0.299 * r + 0.587 * g + 0.114 * b
        return {"hex": hex_color, "isDark": lum < 128}
    except Exception:
        return {"hex": "#ffffff", "isDark": False}


def compute_brightness(image_bytes: bytes) -> int:
    """Compute average brightness of full image (0-255)."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        stat = np.mean(np.array(img))
        return int(round(stat))
    except Exception:
        return 128


def apply_filters(
    image_bytes: bytes,
    brightness: Optional[float] = None,
    contrast: Optional[float] = None,
    saturation: Optional[float] = None,
    grayscale: bool = False,
    blur: Optional[float] = None,
    sharpen: bool = False
) -> bytes:
    """Applies standard filters using Pillow's ImageEnhance module."""
    img = Image.open(io.BytesIO(image_bytes))

    if grayscale:
        img = img.convert('L')
    else:
        img = img.convert('RGB')

    if brightness is not None:
        factor = 1.0 + (brightness / 100.0)
        img = ImageEnhance.Brightness(img).enhance(factor)

    if contrast is not None:
        img = ImageEnhance.Contrast(img).enhance(contrast)

    if saturation is not None and not grayscale:
        img = ImageEnhance.Color(img).enhance(saturation)

    if blur is not None and blur > 0:
        img = img.filter(ImageFilter.GaussianBlur(blur))

    if sharpen:
        img = img.filter(ImageFilter.SHARPEN)

    out = io.BytesIO()
    img.save(out, format='JPEG', quality=92)
    return out.getvalue()


def add_watermark(image_bytes: bytes, text: str = 'Sonikoma') -> bytes:
    """Adds a stylish semi-transparent watermark badge to the bottom-right of the image."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    w, h = img.size

    f_size = max(12, int(w * 0.025))
    font = ImageFont.load_default()

    pad_x = 10
    pad_y = 10

    char_w = int(f_size * 0.6)
    b_w = len(text) * char_w + pad_x * 2
    b_h = f_size + pad_y * 2

    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    draw = ImageDraw.Draw(overlay)

    bx1 = w - b_w - 15
    by1 = h - b_h - 15
    bx2 = w - 15
    by2 = h - 15

    draw.rectangle([bx1, by1, bx2, by2], fill=(0, 0, 0, 115))
    tx = bx1 + pad_x
    ty = by1 + pad_y
    draw.text((tx, ty), text, fill=(255, 255, 255, 230), font=font)

    final_img = Image.alpha_composite(img, overlay)
    out = io.BytesIO()
    final_img.convert("RGB").save(out, format='JPEG', quality=92)
    return out.getvalue()
