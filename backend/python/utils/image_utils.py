"""
backend/python/utils/image_utils.py
─────────────────────────────────────────────────────────────────────────────
Image resolution, analysis, conversion, and processing helper utilities.
All functions operate on raw bytes for zero-disk-I/O speed.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import re
import base64
import os
import time
import httpx
import numpy as np
import logging
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from typing import Dict, Any, Optional, List, Tuple, Literal
from urllib.parse import urlparse, parse_qs

# Import stitched_cache safely (we resolve circular import by keeping it clean)
from utils.cache import stitched_cache

logger = logging.getLogger("anivox.utils.image_utils")

class ImageMeta:
    def __init__(self, width: int, height: int, format_str: str, channels: int, has_alpha: bool, size_bytes: int):
        self.width = width
        self.height = height
        self.format = format_str
        self.channels = channels
        self.hasAlpha = has_alpha
        self.sizeBytes = size_bytes
        
        # GCD calculation
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


async def resolve_image_to_buffer(url_str: str) -> Dict[str, Any]:
    """
    Resolve ANY image URL (absolute, relative, /api/merge-images/cached, proxied)
    into a raw bytes + contentType.
    """
    if not url_str:
        raise ValueError('Empty image URL provided')

    working_url = url_str.strip()

    # 1. Check in-memory merged/stitch cache first (zero-cost retrieval)
    if '/api/merge-images/cached/' in working_url or '/api/stitch-images/cached/' in working_url:
        match = re.search(r'/(?:merge|stitch)-images/cached/([^/?&]+)', working_url)
        if match:
            cache_id = match.group(1)
            cached = stitched_cache.get(cache_id)
            if cached:
                mime = cached.get("content_type", "image/png")
                return {"data": cached["data"], "content_type": mime, "contentType": mime}

    # 2. Unwrap any double-proxied URLs
    if '/api/proxy-image' in working_url:
        parsed = urlparse(working_url)
        query = parse_qs(parsed.query)
        if "url" in query:
            working_url = query["url"][0]

    # 3. Base64 data-URL shortcut — decode inline without any HTTP
    if working_url.startswith('data:image/'):
        header, rest = working_url.split(',', 1)
        buf = base64.b64decode(rest)
        mime_match = re.match(r'^data:(image/[a-z+]+);base64', header)
        mime = mime_match.group(1) if mime_match else "image/jpeg"
        return {"data": buf, "content_type": mime, "contentType": mime}

    # 4. Normalize internal hostnames → relative paths to call localhost directly
    if re.match(r'^https?://', working_url, re.IGNORECASE):
        try:
            parsed = urlparse(working_url)
            host = parsed.hostname or ""
            if "run.app" in host or "localhost" in host or host == "127.0.0.1":
                working_url = parsed.path
                if parsed.query:
                    working_url += "?" + parsed.query
        except Exception:
            pass

    # 5. Relative paths
    if working_url.startswith('/'):
        # Re-route to loopback port
        port = os.getenv("BACKEND_PORT", "5173")
        working_url = f"http://127.0.0.1:{port}{working_url}"

    # 6. Remote fetch with referrer-bypass headers
    logger.info(f"[Image Utils] Fetching image from remote URL: {working_url[:60]}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Referer':    'https://www.webtoons.com/',
        'Accept':     'image/*,*/*;q=0.8',
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        response = await client.get(working_url, headers=headers)
        if response.status_code != 200:
            raise RuntimeError(f"Failed to fetch image: {response.status_code} — {working_url}")
            
        content_type = response.headers.get('Content-Type', 'image/jpeg')
        return {"data": response.content, "content_type": content_type, "contentType": content_type}


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
    import hashlib
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
    
    # Calculate aspect-ratio cropping
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
    """Auto crops uniform margins (whitespace/black gutters) using PIL difference analysis."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size

        if w < 80 or h < 80:
            return {"data": image_bytes, "content_type": f"image/{img.format.lower() if img.format else 'jpeg'}"}

        # Background color
        if background_color_mode == 'white':
            bg_color = (255, 255, 255)
        elif background_color_mode == 'black':
            bg_color = (0, 0, 0)
        else:
            # Corner sampling
            corners = [
                img.getpixel((0, 0)),
                img.getpixel((w - 1, 0)),
                img.getpixel((0, h - 1)),
                img.getpixel((w - 1, h - 1))
            ]
            corners_rgb = []
            for c in corners:
                if isinstance(c, tuple):
                    corners_rgb.append(c[:3])
                else:
                    corners_rgb.append((c, c, c))
            avg_r = int(np.mean([c[0] for c in corners_rgb]))
            avg_g = int(np.mean([c[1] for c in corners_rgb]))
            avg_b = int(np.mean([c[2] for c in corners_rgb]))
            bg_color = (avg_r, avg_g, avg_b)

        # Threshold
        threshold_val = sensitivity if sensitivity is not None else (50.0 if tighter else 25.0)

        bg = Image.new(img.mode, img.size, bg_color)
        diff = ImageChops.difference(img, bg).convert('L')
        
        diff = diff.point(lambda p: 255 if p > threshold_val else 0)
        bbox = diff.getbbox()

        if bbox:
            left, top, right, bottom = bbox
            if (right - left) >= 15 and (bottom - top) >= 15:
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

        extended = ImageOps.expand(trimmed, border=(e_l, e_t, e_r, e_b), fill=bg_color)
        
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
            
        logger.info(f"[Image Utils] Auto-trim successful. New size: {extended.size[0]}x{extended.size[1]}")
        return {"data": out.getvalue(), "content_type": mime}
    except Exception as e:
        logger.error(f"[Image Utils] crop_auto_borders failed: {e}")
        return {"data": image_bytes, "content_type": "image/jpeg"}


def sample_background_color(image_bytes: bytes) -> Dict[str, Any]:
    """Sample background color and determine dark mode setting."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size
        # Sample 16x16 corner
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


def stitch_images_together(
    image_buffers: List[bytes],
    layout: Literal["vertical", "horizontal"] = "vertical",
    spacing: int = 0,
    spacing_color: str = "white",
    scale_to_fit: bool = True,
    align_mode: Literal["center", "start", "end"] = "center",
    padding: int = 0
) -> bytes:
    """Consolidates multiple image buffers into a single stitched canvas."""
    if not image_buffers:
        raise ValueError("No image buffers provided for stitching")

    if len(image_buffers) == 1:
        return image_buffers[0]

    imgs = [Image.open(io.BytesIO(b)) for b in image_buffers]

    bg_color = (255, 255, 255)
    if spacing_color == "black":
        bg_color = (0, 0, 0)
    elif spacing_color == "transparent":
        bg_color = (0, 0, 0, 0)

    gap = spacing
    pad = padding

    # First pass resizing
    prepared_images = []
    if layout == "horizontal":
        canonical_h = imgs[0].size[1]
        for img in imgs:
            if scale_to_fit:
                # scale height
                w, h = img.size
                new_w = int(round(w * (canonical_h / h)))
                img_res = img.resize((new_w, canonical_h), Image.Resampling.LANCZOS)
                prepared_images.append(img_res)
            else:
                prepared_images.append(img)
    else:
        # vertical
        canonical_w = imgs[0].size[0]
        for img in imgs:
            if scale_to_fit:
                # scale width
                w, h = img.size
                new_h = int(round(h * (canonical_w / w)))
                img_res = img.resize((canonical_w, new_h), Image.Resampling.LANCZOS)
                prepared_images.append(img_res)
            else:
                prepared_images.append(img)

    # Calculate coordinates
    widths = [img.size[0] for img in prepared_images]
    heights = [img.size[1] for img in prepared_images]

    total_w = 0
    total_h = 0

    if layout == "horizontal":
        max_h = max(heights)
        total_h = max_h + pad * 2
        total_w = sum(widths) + gap * (len(prepared_images) - 1) + pad * 2

        canvas = Image.new("RGBA" if spacing_color == "transparent" else "RGB", (total_w, total_h), bg_color)
        offset_x = pad
        for img in prepared_images:
            w, h = img.size
            offset_y = pad
            if align_mode == "center":
                offset_y = pad + (max_h - h) // 2
            elif align_mode == "end":
                offset_y = pad + (max_h - h)
            canvas.paste(img, (offset_x, offset_y))
            offset_x += w + gap
    else:
        # vertical
        max_w = max(widths)
        total_w = max_w + pad * 2
        total_h = sum(heights) + gap * (len(prepared_images) - 1) + pad * 2

        canvas = Image.new("RGBA" if spacing_color == "transparent" else "RGB", (total_w, total_h), bg_color)
        offset_y = pad
        for img in prepared_images:
            w, h = img.size
            offset_x = pad
            if align_mode == "center":
                offset_x = pad + (max_w - w) // 2
            elif align_mode == "end":
                offset_x = pad + (max_w - w)
            canvas.paste(img, (offset_x, offset_y))
            offset_y += h + gap

    out = io.BytesIO()
    canvas.save(out, format="PNG")
    return out.getvalue()


def stack_vertical(buffers: List[bytes], gap: int = 0, background: str = '#ffffff') -> Dict[str, Any]:
    """Vertically merge multiple image buffers into a unified tall canvas."""
    if not buffers:
        raise ValueError('No buffers provided to stack_vertical')
    if len(buffers) == 1:
        return {"data": buffers[0], "content_type": "image/jpeg"}
    
    # Re-use our new robust stitcher
    res_bytes = stitch_images_together(
        buffers,
        layout="vertical",
        spacing=gap,
        spacing_color="black" if background.lower() in ("#000", "#000000", "black") else "white",
        scale_to_fit=True
    )
    return {"data": res_bytes, "content_type": "image/png"}


def apply_filters(
    image_bytes: bytes,
    brightness: Optional[float] = None, # -100 to +100
    contrast: Optional[float] = None,   # 0.1 to 3.0
    saturation: Optional[float] = None, # 0 to 3.0
    grayscale: bool = False,
    blur: Optional[float] = None,       # sigma
    sharpen: bool = False
) -> bytes:
    """Applies standard filters using Pillow's ImageEnhance module."""
    img = Image.open(io.BytesIO(image_bytes))

    if grayscale:
        img = img.convert('L')
    else:
        img = img.convert('RGB')

    if brightness is not None:
        # modulate: 1.0 is original, -100 to +100 translates to 0.0 to 2.0
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


def add_watermark(image_bytes: bytes, text: str = 'Anivox') -> bytes:
    """Adds a stylish semi-transparent watermark badge to the bottom-right of the image."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    w, h = img.size
    
    # SVG-like box rendering
    f_size = max(12, int(w * 0.025))
    font = ImageFont.load_default() # Use default system font
    
    pad_x = 10
    pad_y = 10
    
    # Calculate text width/height
    # draw text bounding box estimate
    char_w = int(f_size * 0.6)
    b_w = len(text) * char_w + pad_x * 2
    b_h = f_size + pad_y * 2
    
    # Create overlay
    overlay = Image.new('RGBA', img.size, (0,0,0,0))
    draw = ImageDraw.Draw(overlay)
    
    # Box position
    bx1 = w - b_w - 15
    by1 = h - b_h - 15
    bx2 = w - 15
    by2 = h - 15
    
    # Draw dark translucent rectangle
    draw.rectangle([bx1, by1, bx2, by2], fill=(0, 0, 0, 115))
    # Draw white text
    tx = bx1 + pad_x
    ty = by1 + pad_y
    draw.text((tx, ty), text, fill=(255, 255, 255, 230), font=font)
    
    final_img = Image.alpha_composite(img, overlay)
    out = io.BytesIO()
    final_img.convert("RGB").save(out, format='JPEG', quality=92)
    return out.getvalue()
