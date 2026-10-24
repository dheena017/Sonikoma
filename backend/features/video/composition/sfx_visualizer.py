"""
backend/features/video/composition/sfx_visualizer.py
─────────────────────────────────────────────────────────────────────────────
Manga action lettering, radial speed lines, and visual sound effect overlays.
─────────────────────────────────────────────────────────────────────────────
"""

import math
from PIL import Image, ImageDraw, ImageFont
from typing import Optional


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _draw_radial_speed_lines(draw: ImageDraw.ImageDraw, width: int, height: int, density: int = 24):
    """Draws comic action speed lines radiating from center toward the canvas periphery."""
    center_x, center_y = width // 2, height // 2
    max_radius = int(math.hypot(center_x, center_y))
    inner_radius = int(min(center_x, center_y) * 0.55)

    for i in range(density):
        angle = (2 * math.pi / density) * i
        x_start = center_x + int(inner_radius * math.cos(angle))
        y_start = center_y + int(inner_radius * math.sin(angle))
        x_end = center_x + int(max_radius * math.cos(angle))
        y_end = center_y + int(max_radius * math.sin(angle))
        draw.line([(x_start, y_start), (x_end, y_end)], fill=(255, 255, 255, 70), width=2)


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

def add_sfx_text(
    frame: Image.Image,
    sfx_text: str,
    impact_level: str = "medium"
) -> Image.Image:
    """Adds action text and speed lines onto a video frame."""
    if not sfx_text or not sfx_text.strip():
        return frame

    img = frame.copy().convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    width, height = img.size

    density_map = {"low": 16, "medium": 32, "high": 48, "extreme": 64}
    density = density_map.get(impact_level.lower(), 32)
    _draw_radial_speed_lines(draw, width, height, density=density)

    try:
        font = ImageFont.truetype("arial.ttf", 64)
    except Exception:
        font = ImageFont.load_default()

    clean_text = sfx_text.upper().strip()
    bbox = draw.textbbox((0, 0), clean_text, font=font) if hasattr(draw, "textbbox") and font else (0, 0, 200, 50)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (width - tw) // 2
    ty = int(height * 0.25)

    outline_color = (15, 15, 20, 240)
    fill_color = (255, 220, 40, 255) if impact_level in ("high", "extreme") else (255, 255, 255, 240)
    for dx in (-3, -2, -1, 0, 1, 2, 3):
        for dy in (-3, -2, -1, 0, 1, 2, 3):
            if dx != 0 or dy != 0:
                draw.text((tx + dx, ty + dy), clean_text, font=font, fill=outline_color)
    draw.text((tx, ty), clean_text, font=font, fill=fill_color)

    combined = Image.alpha_composite(img, overlay)
    return combined.convert("RGB")


# Backward compatibility alias
overlay_manga_sfx = add_sfx_text

__all__ = [
    "add_sfx_text",
    "overlay_manga_sfx",
]
