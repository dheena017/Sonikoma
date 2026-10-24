"""
backend/features/image/transform/text_overlay_service.py
─────────────────────────────────────────────────────────────────────────────
Text Overlay Service:
- Overlays typography, captions, and watermarks onto images
- Supports alignment presets ('center', 'top', 'bottom', 'top_left', etc.)
- Configurable stroke outline for crisp legibility over varied backgrounds
─────────────────────────────────────────────────────────────────────────────
"""

import io
from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageColor


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _load_font(font_size: int) -> ImageFont.ImageFont:
    """Attempts to load a standard TrueType font, falling back to default."""
    for font_name in ("arial.ttf", "segoeui.ttf", "DejaVuSans.ttf", "Helvetica.ttf"):
        try:
            return ImageFont.truetype(font_name, font_size)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def _compute_coordinates(
    img_w: int,
    img_h: int,
    text_w: int,
    text_h: int,
    position: str
) -> Tuple[int, int]:
    """Computes (x, y) coordinates for text box alignment."""
    pos = position.lower().strip()
    margin = 24

    if pos == "center":
        return ((img_w - text_w) // 2, (img_h - text_h) // 2)
    elif pos in ("top", "top_center"):
        return ((img_w - text_w) // 2, margin)
    elif pos in ("bottom", "bottom_center"):
        return ((img_w - text_w) // 2, max(0, img_h - text_h - margin))
    elif pos in ("top_left", "left"):
        return (margin, margin)
    elif pos == "top_right":
        return (max(0, img_w - text_w - margin), margin)
    elif pos == "bottom_left":
        return (margin, max(0, img_h - text_h - margin))
    elif pos in ("bottom_right", "right"):
        return (max(0, img_w - text_w - margin), max(0, img_h - text_h - margin))
    else:
        # Default fallback to center
        return ((img_w - text_w) // 2, (img_h - text_h) // 2)


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

def overlay_text(
    image_bytes: bytes,
    text: str,
    font_size: int = 40,
    text_color: str = "white",
    position: str = "center",
    opacity: float = 1.0,
    stroke_color: Optional[str] = "black",
    stroke_width: int = 2,
    output_format: str = "PNG"
) -> bytes:
    """
    Renders styled text over an image buffer.

    Args:
        image_bytes: Raw input image buffer.
        text: Text string to render.
        font_size: Font size in pixels.
        text_color: Text fill color string (e.g. 'white', '#FFFFFF').
        position: Alignment preset ('center', 'top', 'bottom', 'bottom_right').
        opacity: Transparency factor (0.0 transparent to 1.0 fully opaque).
        stroke_color: Optional outline stroke color string for high contrast.
        stroke_width: Outline stroke width in pixels.
        output_format: Target format ('PNG', 'JPEG', 'WEBP').

    Returns:
        Rendered image bytes.
    """
    if not image_bytes:
        raise ValueError("Image buffer cannot be empty.")

    if not text:
        return image_bytes

    base = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    txt_layer = Image.new("RGBA", base.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(txt_layer)

    font = _load_font(font_size)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]

    x, y = _compute_coordinates(base.width, base.height, tw, th, position)

    # Resolve colors
    fill_rgb = ImageColor.getrgb(text_color)
    alpha = int(255 * max(0.0, min(1.0, opacity)))
    fill_rgba = (fill_rgb[0], fill_rgb[1], fill_rgb[2], alpha)

    draw_kwargs = {"fill": fill_rgba, "font": font}
    if stroke_color and stroke_width > 0:
        s_rgb = ImageColor.getrgb(stroke_color)
        draw_kwargs["stroke_width"] = stroke_width
        draw_kwargs["stroke_fill"] = (s_rgb[0], s_rgb[1], s_rgb[2], alpha)

    draw.text((x, y), text, **draw_kwargs)

    # Composite layers
    combined = Image.alpha_composite(base, txt_layer)

    out = io.BytesIO()
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"

    if fmt == "JPEG":
        combined = combined.convert("RGB")

    combined.save(out, format=fmt)
    return out.getvalue()


__all__ = [
    "overlay_text",
]
