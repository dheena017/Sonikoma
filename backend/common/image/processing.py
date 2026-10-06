"""
backend/common/image/processing.py
─────────────────────────────────────────────────────────────────────────────
Common PIL/NumPy image inspection, format conversion, and placeholder generation.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from typing import Dict, Any, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageStat

logger = logging.getLogger("sonikoma.common.image.processing")


def get_image_metadata(img_bytes: bytes) -> Dict[str, Any]:
    """
    Extracts essential image metadata: width, height, format, color mode, and aspect ratio.
    """
    if not img_bytes:
        return {"width": 0, "height": 0, "format": None, "mode": None, "aspect_ratio": 1.0}
    try:
        with Image.open(io.BytesIO(img_bytes)) as img:
            w, h = img.size
            return {
                "width": w,
                "height": h,
                "format": img.format or "UNKNOWN",
                "mode": img.mode,
                "aspect_ratio": round(w / h, 4) if h > 0 else 1.0,
                "size_bytes": len(img_bytes),
            }
    except Exception as e:
        logger.warning(f"[Common Image] Failed to read metadata: {e}")
        return {"width": 0, "height": 0, "format": None, "mode": None, "aspect_ratio": 1.0}


def compute_image_brightness(img_bytes: bytes) -> float:
    """
    Calculates average grayscale luminance (0.0 = pure black, 255.0 = pure white).
    """
    if not img_bytes:
        return 128.0
    try:
        with Image.open(io.BytesIO(img_bytes)) as img:
            gray = img.convert("L")
            stat = ImageStat.Stat(gray)
            return float(stat.mean[0])
    except Exception:
        return 128.0


def convert_image_format(
    img_bytes: bytes,
    target_format: str = "WEBP",
    quality: int = 85,
) -> bytes:
    """
    Converts image byte stream into target format (e.g. 'WEBP', 'JPEG', 'PNG').
    """
    if not img_bytes:
        return b""
    try:
        with Image.open(io.BytesIO(img_bytes)) as img:
            out_buf = io.BytesIO()
            fmt = target_format.upper()
            if fmt in ("JPEG", "JPG") and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            img.save(out_buf, format=fmt, quality=quality)
            return out_buf.getvalue()
    except Exception as e:
        logger.warning(f"[Common Image] Conversion to {target_format} failed: {e}")
        return img_bytes


def create_placeholder_image(
    width: int = 800,
    height: int = 600,
    text: str = "Sonikoma Placeholder",
    bg_color: str = "#1e293b",
    text_color: str = "#94a3b8",
) -> bytes:
    """
    Generates a clean synthetic PNG image buffer with centered title label.
    """
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw border
    draw.rectangle([(2, 2), (width - 3, height - 3)], outline="#334155", width=2)

    # Draw centered text
    try:
        # Default fallback font
        font = ImageFont.load_default()
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        x = (width - text_w) // 2
        y = (height - text_h) // 2
        draw.text((x, y), text, fill=text_color, font=font)
    except Exception:
        pass

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def create_svg_placeholder(
    title: str = "Image Placeholder",
    subtitle: str = "Loading or unavailable",
    width: int = 800,
    height: int = 600,
    color_hex: str = "#6366F1",
) -> str:
    """
    Generates a polished inline SVG data URI placeholder for web and app previews.
    """
    t_clean = (title or "Placeholder")[:50].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    s_clean = (subtitle or "")[:80].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        f'<rect width="100%" height="100%" fill="#0f172a"/>'
        f'<rect x="20" y="20" width="{width - 40}" height="{height - 40}" rx="16" fill="#1e293b" stroke="{color_hex}" stroke-width="2" stroke-dasharray="6,6"/>'
        f'<text x="50%" y="46%" font-family="system-ui,-apple-system,sans-serif" font-weight="700" font-size="28" fill="#f8fafc" text-anchor="middle">{t_clean}</text>'
        f'<text x="50%" y="54%" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#94a3b8" text-anchor="middle">{s_clean}</text>'
        f'</svg>'
    )
    import urllib.parse
    return f"data:image/svg+xml;utf8,{urllib.parse.quote(svg)}"


def trim_image_borders(
    img_bytes: bytes,
    tighter: bool = False,
    crop_padding: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Safely trims uniform background borders (white/black margins) from an image buffer.
    Returns dict with 'data': bytes and 'content_type': str.
    """
    if not img_bytes:
        return {"data": img_bytes, "content_type": "image/jpeg"}

    try:
        import numpy as np
        with Image.open(io.BytesIO(img_bytes)) as img:
            orig_format = img.format or "JPEG"
            fmt_lower = orig_format.lower()
            if fmt_lower in ("jpeg", "jpg"):
                content_type = "image/jpeg"
            elif fmt_lower == "png":
                content_type = "image/png"
            elif fmt_lower == "webp":
                content_type = "image/webp"
            else:
                content_type = f"image/{fmt_lower}"

            w, h = img.size
            if h < 30 or w < 30:
                return {"data": img_bytes, "content_type": content_type}

            converted = img.convert("RGB")
            arr = np.array(converted)

            top_strip = arr[:5, :, :]
            bottom_strip = arr[-5:, :, :]
            left_strip = arr[:, :5, :]
            right_strip = arr[:, :, -5:]

            max_border_std = 18.0 if not tighter else 30.0
            top_bg = np.median(top_strip.reshape(-1, 3), axis=0) if float(np.std(top_strip)) < max_border_std else None
            bottom_bg = np.median(bottom_strip.reshape(-1, 3), axis=0) if float(np.std(bottom_strip)) < max_border_std else None
            left_bg = np.median(left_strip.reshape(-1, 3), axis=0) if float(np.std(left_strip)) < max_border_std else None
            right_bg = np.median(right_strip.reshape(-1, 3), axis=0) if float(np.std(right_strip)) < max_border_std else None

            if top_bg is None and bottom_bg is None and left_bg is None and right_bg is None:
                return {"data": img_bytes, "content_type": content_type}

            y_min, y_max = 0, h
            x_min, x_max = 0, w
            threshold = 15.0 if tighter else 25.0

            if top_bg is not None:
                diff_top = np.max(np.abs(arr.astype(float) - top_bg), axis=2)
                content_rows = np.where(np.any(diff_top > threshold, axis=1))[0]
                if len(content_rows) > 0:
                    y_min = int(content_rows[0])

            if bottom_bg is not None:
                diff_bot = np.max(np.abs(arr.astype(float) - bottom_bg), axis=2)
                content_rows = np.where(np.any(diff_bot > threshold, axis=1))[0]
                if len(content_rows) > 0:
                    y_max = int(content_rows[-1]) + 1

            if left_bg is not None:
                diff_left = np.max(np.abs(arr.astype(float) - left_bg), axis=2)
                content_cols = np.where(np.any(diff_left > threshold, axis=0))[0]
                if len(content_cols) > 0:
                    x_min = int(content_cols[0])

            if right_bg is not None:
                diff_right = np.max(np.abs(arr.astype(float) - right_bg), axis=2)
                content_cols = np.where(np.any(diff_right > threshold, axis=0))[0]
                if len(content_cols) > 0:
                    x_max = int(content_cols[-1]) + 1

            max_crop_pct = 0.20 if tighter else 0.12
            x_min = min(x_min, int(w * max_crop_pct))
            y_min = min(y_min, int(h * max_crop_pct))
            x_max = max(x_max, w - int(w * max_crop_pct))
            y_max = max(y_max, h - int(h * max_crop_pct))

            pad = crop_padding if crop_padding is not None else 0
            if pad > 0:
                x_min = max(0, x_min - pad)
                y_min = max(0, y_min - pad)
                x_max = min(w, x_max + pad)
                y_max = min(h, y_max + pad)

            if (x_max - x_min) >= 30 and (y_max - y_min) >= 30:
                if x_min > 0 or y_min > 0 or x_max < w or y_max < h:
                    cropped = img.crop((x_min, y_min, x_max, y_max))
                    out = io.BytesIO()
                    cropped.save(out, format=orig_format, quality=95)
                    return {"data": out.getvalue(), "content_type": content_type}

            return {"data": img_bytes, "content_type": content_type}
    except Exception as e:
        logger.warning(f"[Common Image] trim_image_borders failed: {e}")
        return {"data": img_bytes, "content_type": "image/jpeg"}


crop_auto_borders = trim_image_borders


__all__ = [
    "get_image_metadata",
    "compute_image_brightness",
    "convert_image_format",
    "create_placeholder_image",
    "create_svg_placeholder",
    "trim_image_borders",
    "crop_auto_borders",
]
