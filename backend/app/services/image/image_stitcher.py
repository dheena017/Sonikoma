"""
backend/app/services/image/image_stitcher.py
─────────────────────────────────────────────────────────────────────────────
Image canvas stitching utilities (vertical or horizontal layouts) for multi-panel strips.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from PIL import Image
from typing import List, Dict, Any, Literal

logger = logging.getLogger("sonikoma.services.image.image_stitcher")


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

    prepared_images = []
    if layout == "horizontal":
        canonical_h = max(img.size[1] for img in imgs)
        for img in imgs:
            w, h = img.size
            if scale_to_fit and h != canonical_h:
                new_w = int(round(w * (canonical_h / h)))
                img_res = img.resize((new_w, canonical_h), Image.Resampling.BICUBIC)
                prepared_images.append(img_res)
            else:
                prepared_images.append(img)
    else:
        canonical_w = max(img.size[0] for img in imgs)
        for img in imgs:
            w, h = img.size
            if scale_to_fit and w != canonical_w:
                new_h = int(round(h * (canonical_w / w)))
                img_res = img.resize((canonical_w, new_h), Image.Resampling.BICUBIC)
                prepared_images.append(img_res)
            else:
                prepared_images.append(img)

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

    MAX_HEIGHT_LIMIT = 60000
    if total_h > MAX_HEIGHT_LIMIT:
        scale_factor = MAX_HEIGHT_LIMIT / total_h
        new_size = (int(total_w * scale_factor), int(total_h * scale_factor))
        logger.info(f"[Image Stitcher] Stitched image height ({total_h}px) exceeds safety limit. Downscaling to {new_size[1]}px.")
        canvas = canvas.resize(new_size, Image.Resampling.LANCZOS)

    out = io.BytesIO()
    if spacing_color == "transparent":
        canvas.save(out, format="PNG")
    else:
        if canvas.mode == "RGBA":
            canvas = canvas.convert("RGB")
        canvas.save(out, format="JPEG", quality=85)
    return out.getvalue()


def stack_vertical(buffers: List[bytes], gap: int = 0, background: str = '#ffffff') -> Dict[str, Any]:
    """Vertically merge multiple image buffers into a unified tall canvas."""
    if not buffers:
        raise ValueError('No buffers provided to stack_vertical')
    if len(buffers) == 1:
        return {"data": buffers[0], "content_type": "image/jpeg"}

    res_bytes = stitch_images_together(
        buffers,
        layout="vertical",
        spacing=gap,
        spacing_color="black" if background.lower() in ("#000", "#000000", "black") else "white",
        scale_to_fit=True
    )
    return {"data": res_bytes, "content_type": "image/png"}
