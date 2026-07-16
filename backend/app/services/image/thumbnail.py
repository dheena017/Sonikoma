import os
import io
import logging
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from typing import List, Dict, Any, Optional
import numpy as np

from services.image.image_utils import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.services.thumbnail")

async def compose_thumbnail(
    recipe: Dict[str, Any],
    panels: List[Dict[str, Any]],
    target_width: int = 1280,
    target_height: int = 720
) -> bytes:
    """
    Programmatically composes a thumbnail based on a recipe.
    """
    logger.info(f"[Thumbnail Engine] Composing thumbnail with archetype: {recipe.get('layout_archetype')}")

    # 1. Create Canvas
    canvas = Image.new("RGB", (target_width, target_height), (0, 0, 0))

    # 2. Draw Background
    bg_type = recipe.get("background_type", "blurred_panel")
    bg_idx = recipe.get("background_panel_index", 0)

    if bg_type == "blurred_panel" and bg_idx < len(panels):
        try:
            res = await resolve_image_to_buffer(panels[bg_idx]["image_url"])
            bg_img = Image.open(io.BytesIO(res["data"])).convert("RGB")
            bg_img = bg_img.resize((target_width, target_height), Image.Resampling.LANCZOS)
            bg_img = bg_img.filter(ImageFilter.GaussianBlur(20))
            canvas.paste(bg_img, (0, 0))
        except Exception as e:
            logger.error(f"Failed to load background panel: {e}")
            _draw_gradient(canvas, recipe.get("text_color", "#FFFFFF"))
    elif bg_type == "color_gradient":
        _draw_gradient(canvas, recipe.get("text_color", "#FFFFFF"))
    else:
        # Default fallback gradient
        _draw_gradient(canvas, "#8A2BE2") # BlueViolet

    # 3. Layer Focal Assets
    focal_assets = recipe.get("focal_assets", [])
    layout = recipe.get("layout_archetype", "centered_hero")

    for i, asset in enumerate(focal_assets):
        p_idx = asset.get("panel_index", 0)
        if p_idx >= len(panels): continue

        try:
            res = await resolve_image_to_buffer(panels[p_idx]["image_url"])
            asset_img = Image.open(io.BytesIO(res["data"])).convert("RGBA")

            # Smarter focal extraction: Detect panels/faces if possible
            # For now, we use a slightly more zoomed center crop or full if it's already a panel
            aw, ah = asset_img.size
            if aw / ah > 1.2 or ah / aw > 1.2:
                # If it's a very non-square aspect, it might be a strip or wide shot,
                # we zoom in on the center 70% to find the subject
                crop_w = int(aw * 0.7)
                crop_h = int(ah * 0.7)
                left = (aw - crop_w) // 2
                top = (ah - crop_h) // 2
                asset_img = asset_img.crop((left, top, left + crop_w, top + crop_h))

            # Convert back to RGBA for transparency support in pasting
            asset_img = asset_img.convert("RGBA")

            # Resize based on layout
            if layout == "split_screen":
                target_size = (target_width // 2, target_height)
                asset_img = asset_img.resize(target_size, Image.Resampling.LANCZOS)
                pos = (0 if i == 0 else target_width // 2, 0)
                canvas.paste(asset_img, pos, asset_img)
            elif layout == "rule_of_thirds":
                target_size = (int(target_height * 0.8), int(target_height * 0.8))
                asset_img = asset_img.resize(target_size, Image.Resampling.LANCZOS)
                pos = (int(target_width * 0.05), int(target_height * 0.1))
                canvas.paste(asset_img, pos, asset_img)
            else: # centered_hero
                target_size = (int(target_height * 0.9), int(target_height * 0.9))
                asset_img = asset_img.resize(target_size, Image.Resampling.LANCZOS)
                pos = ((target_width - target_size[0]) // 2, (target_height - target_size[1]) // 2)
                canvas.paste(asset_img, pos, asset_img)

        except Exception as e:
            logger.error(f"Failed to process focal asset {i}: {e}")

    # 4. Typography Overlay
    overlay_text = recipe.get("overlay_text", "").upper()
    if overlay_text:
        _draw_text(canvas, overlay_text, recipe.get("text_color", "#FFFF00"), layout)

    # 5. Output
    out = io.BytesIO()
    canvas.save(out, format="JPEG", quality=95)
    return out.getvalue()

def _draw_gradient(canvas, color_hex):
    draw = ImageDraw.Draw(canvas)
    w, h = canvas.size

    # Simple top-to-bottom dark gradient
    try:
        top_color = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    except:
        top_color = (138, 43, 226)

    for y in range(h):
        ratio = y / h
        r = int(top_color[0] * (1 - ratio) * 0.4)
        g = int(top_color[1] * (1 - ratio) * 0.4)
        b = int(top_color[2] * (1 - ratio) * 0.4)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

def _draw_text(canvas, text, color_hex, layout):
    draw = ImageDraw.Draw(canvas)
    w, h = canvas.size

    # Try to load a bold font
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "arialbd.ttf"
    ]
    font = None
    font_size = 100
    for path in font_paths:
        try:
            font = ImageFont.truetype(path, font_size)
            break
        except:
            continue

    if not font:
        font = ImageFont.load_default()

    # Calculate position to avoid bottom-right (YouTube timestamp)
    # Safe area: top 70% or left 70%
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_w = text_bbox[2] - text_bbox[0]
    text_h = text_bbox[3] - text_bbox[1]

    if layout == "rule_of_thirds":
        pos = (int(w * 0.6) - text_w // 2, h // 2 - text_h // 2)
    elif layout == "split_screen":
        pos = (w // 2 - text_w // 2, h // 4 - text_h // 2)
    else: # centered_hero
        pos = (w // 2 - text_w // 2, int(h * 0.8) - text_h // 2)

    # Draw Shadow
    shadow_offset = 5
    draw.text((pos[0] + shadow_offset, pos[1] + shadow_offset), text, font=font, fill=(0, 0, 0))

    # Draw Outline
    outline_range = 3
    for dx in range(-outline_range, outline_range + 1):
        for dy in range(-outline_range, outline_range + 1):
            draw.text((pos[0] + dx, pos[1] + dy), text, font=font, fill=(0, 0, 0))

    # Draw Main Text
    try:
        fill_color = tuple(int(color_hex.lstrip('#')[i:i+2], 16) for i in (0, 2, 4))
    except:
        fill_color = (255, 255, 0)
    draw.text(pos, text, font=font, fill=fill_color)
