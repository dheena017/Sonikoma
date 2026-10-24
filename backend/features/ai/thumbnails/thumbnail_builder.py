"""
Cover image composer and banner builder.

Composes 16:9 YouTube/comic cover images with character cutouts, glowing borders,
and eye-catching text badges.
"""

from typing import Optional, Tuple
from PIL import Image, ImageDraw, ImageOps, ImageFilter


def _draw_curved_banner(draw: ImageDraw.ImageDraw, text: str, width: int, height: int) -> None:
    """Draws a bold angled text banner at the bottom-left of the cover."""
    banner_box = [30, height - 140, min(width - 30, 30 + len(text) * 22 + 40), height - 40]
    draw.rectangle(banner_box, fill=(230, 20, 40))
    draw.rectangle(banner_box, outline=(255, 255, 255), width=3)
    draw.text((45, height - 110), text.upper(), fill=(255, 255, 255))


def _add_glow_border(picture: Image.Image, color: Tuple[int, int, int] = (255, 215, 0)) -> Image.Image:
    """Adds a subtle glowing inner border to the thumbnail."""
    w, h = picture.size
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    draw.rectangle([10, 10, w - 10, h - 10], outline=color + (180,), width=6)
    blurred = glow.filter(ImageFilter.GaussianBlur(radius=4))
    res = picture.convert("RGBA")
    res.paste(blurred, (0, 0), blurred)
    return res.convert("RGB")


def make_cover_image(
    background_picture: Image.Image,
    banner_text: Optional[str] = None,
    character_cutout: Optional[Image.Image] = None,
    width: int = 1280,
    height: int = 720
) -> Image.Image:
    """Builds a complete, professional YouTube/comic cover image with text and glowing borders."""
    canvas = ImageOps.fit(background_picture.convert("RGB"), (width, height))

    if character_cutout:
        cutout_resized = character_cutout.convert("RGBA")
        cutout_w, cutout_h = cutout_resized.size
        scale = (height * 0.9) / max(1, cutout_h)
        new_w, new_h = int(cutout_w * scale), int(cutout_h * scale)
        cutout_resized = cutout_resized.resize((new_w, new_h), Image.Resampling.LANCZOS)
        # Paste on right side
        pos_x = width - new_w - 40
        pos_y = height - new_h
        canvas.paste(cutout_resized, (pos_x, pos_y), cutout_resized)

    if banner_text:
        draw = ImageDraw.Draw(canvas)
        _draw_curved_banner(draw, banner_text, width, height)

    return _add_glow_border(canvas)


__all__ = ["make_cover_image"]
