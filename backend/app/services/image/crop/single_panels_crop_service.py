"""
backend/app/services/image/crop/single_panels_crop_service.py
─────────────────────────────────────────────────────────────────────────────
4-Way Directional Margin Cropper for Single Images & Isolated Panels:
- Crops Above (crop_top), Bottom (crop_bottom), Left (crop_left), Right (crop_right)
- Supports percent (0-100%) and pixel units
- Color-distance Euclidean auto-trim (removes compression artifacts & scan noise)
- Aspect ratio snapping (9:16 vertical video, 16:9 widescreen, 1:1 square, 4:5 social)
- Single-pass rotation and flip support
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import time
import uuid
import logging
from typing import Optional, Dict, Any, Tuple

from PIL import Image, ImageOps
import numpy as np

from schemas.crop import SinglePanelsCropRequest, SinglePanelsCropResponse
from services.image.utils.image_resolver import resolve_image_to_buffer
from app.core.cache import stitched_cache

logger = logging.getLogger("sonikoma.services.crop.single_panels")

# Local media storage directory (Sonikoma/data/local_media)
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
MEDIA_DIR = os.path.join(PROJECT_ROOT, "data", "local_media")
os.makedirs(MEDIA_DIR, exist_ok=True)


def _apply_color_distance_autotrim(img: Image.Image, tolerance: int = 15) -> Tuple[Image.Image, bool]:
    """
    Trims solid/scanned borders using Euclidean color distance from corner pixels.
    """
    try:
        rgb = np.array(img.convert("RGB"))
        h, w, _ = rgb.shape
        if h < 20 or w < 20:
            return img, False

        # Sample corner background color
        corners = [rgb[0, 0], rgb[0, w-1], rgb[h-1, 0], rgb[h-1, w-1]]
        bg_rgb = np.mean(corners, axis=0)

        # Compute Euclidean distance of every pixel to background color
        diff = np.linalg.norm(rgb - bg_rgb, axis=2)
        is_content = diff > tolerance

        if not np.any(is_content):
            return img, False

        rows = np.any(is_content, axis=1)
        cols = np.any(is_content, axis=0)

        ymin, ymax = np.where(rows)[0][[0, -1]]
        xmin, xmax = np.where(cols)[0][[0, -1]]

        # Ensure reasonable bounds
        if (xmax - xmin >= 10) and (ymax - ymin >= 10):
            trimmed = img.crop((int(xmin), int(ymin), int(xmax + 1), int(ymax + 1)))
            return trimmed, True

    except Exception as err:
        logger.warning(f"[SinglePanelsCrop] Auto-trim failed, using untrimmed: {err}")

    return img, False


def _apply_aspect_ratio_snap(img: Image.Image, ratio_str: str) -> Image.Image:
    """
    Snaps / pads the cropped image to target aspect ratio (e.g. 9:16, 16:9, 1:1).
    """
    ratio_map = {
        "9:16": 9.0 / 16.0,
        "16:9": 16.0 / 9.0,
        "1:1": 1.0,
        "4:5": 4.0 / 5.0,
        "4:3": 4.0 / 3.0,
    }
    if ratio_str not in ratio_map:
        return img

    target_ratio = ratio_map[ratio_str]
    curr_w, curr_h = img.size
    curr_ratio = curr_w / float(curr_h)

    # Current image is narrower than target -> center crop vertically or pad horizontally
    if curr_ratio < target_ratio:
        # Match target by cropping height
        new_h = int(curr_w / target_ratio)
        if new_h <= curr_h:
            y_offset = (curr_h - new_h) // 2
            return img.crop((0, y_offset, curr_w, y_offset + new_h))
    elif curr_ratio > target_ratio:
        # Match target by cropping width
        new_w = int(curr_h * target_ratio)
        if new_w <= curr_w:
            x_offset = (curr_w - new_w) // 2
            return img.crop((x_offset, 0, x_offset + new_w, curr_h))

    return img


async def crop_single_panels_margins(request: SinglePanelsCropRequest) -> SinglePanelsCropResponse:
    """
    Executes directional margin cropping, optional auto-trim, and aspect ratio snapping on a single image.
    """
    start_time = time.perf_counter()

    resolved = await resolve_image_to_buffer(request.url)
    img_bytes = resolved.get("data")
    if not img_bytes:
        raise ValueError(f"Could not resolve image data from URL: {request.url}")

    with Image.open(io.BytesIO(img_bytes)) as pil_img:
        img = pil_img.copy()

    # 1. Apply Rotation if specified
    if request.rotate and request.rotate != 0:
        img = img.rotate(request.rotate, expand=True)

    # 2. Apply Flip Horizontal if specified
    if request.flip_horizontal:
        img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    w, h = img.size

    # 3. Calculate Directional Crop Margins (Above, Bottom, Left, Right)
    if request.unit == "pixels":
        top_px = max(0, min(h - 1, int(request.crop_top)))
        bot_px = max(0, min(h - 1, int(request.crop_bottom)))
        left_px = max(0, min(w - 1, int(request.crop_left)))
        right_px = max(0, min(w - 1, int(request.crop_right)))
    else:
        # Percentage (0-100%)
        top_pct = request.crop_top if request.crop_top <= 1.0 else (request.crop_top / 100.0)
        bot_pct = request.crop_bottom if request.crop_bottom <= 1.0 else (request.crop_bottom / 100.0)
        left_pct = request.crop_left if request.crop_left <= 1.0 else (request.crop_left / 100.0)
        right_pct = request.crop_right if request.crop_right <= 1.0 else (request.crop_right / 100.0)

        top_px = max(0, min(h - 1, int(top_pct * h)))
        bot_px = max(0, min(h - 1, int(bot_pct * h)))
        left_px = max(0, min(w - 1, int(left_pct * w)))
        right_px = max(0, min(w - 1, int(right_pct * w)))

    x1 = left_px
    y1 = top_px
    x2 = max(x1 + 10, w - right_px)
    y2 = max(y1 + 10, h - bot_px)

    crop_w = x2 - x1
    crop_h = y2 - y1


    if crop_w >= 5 and crop_h >= 5:
        img = img.crop((x1, y1, x2, y2))

    # 4. Optional Background Auto-Trim
    auto_trimmed = False
    if request.auto_trim:
        img, auto_trimmed = _apply_color_distance_autotrim(img, tolerance=request.color_tolerance)
        if auto_trimmed:
            pass

    # 5. Optional Aspect Ratio Snapping
    if request.aspect_ratio and request.aspect_ratio != "free":
        img = _apply_aspect_ratio_snap(img, request.aspect_ratio)

    # 6. Optional Padding
    if request.padding_px > 0:
        img = ImageOps.expand(img, border=request.padding_px, fill=(255, 255, 255))

    final_w, final_h = img.size

    # 7. Output Format & Compression
    target_fmt = (request.output_format or "webp").upper()
    if target_fmt in ("JPG", "JPEG"):
        target_fmt = "JPEG"
        content_type = "image/jpeg"
        ext = "jpg"
        if img.mode in ("RGBA", "LA", "P"):
            bg = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode != "RGBA":
                img = img.convert("RGBA")
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != "RGB":
            img = img.convert("RGB")
    elif target_fmt == "PNG":
        content_type = "image/png"
        ext = "png"
    else:
        target_fmt = "WEBP"
        content_type = "image/webp"
        ext = "webp"

    out_io = io.BytesIO()
    save_opts = {"quality": request.quality} if target_fmt in ("WEBP", "JPEG") else {}
    img.save(out_io, format=target_fmt, **save_opts)
    output_bytes = out_io.getvalue()

    # Save to /media/
    unique_filename = f"single_crop_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}.{ext}"
    file_path = os.path.join(MEDIA_DIR, unique_filename)
    with open(file_path, "wb") as f:
        f.write(output_bytes)

    media_url = f"/media/{unique_filename}"
    stitched_cache.set(f"single_{unique_filename}", {"data": output_bytes, "content_type": content_type})

    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(f"[SinglePanelsCrop] Cropped image to {final_w}x{final_h}px in {elapsed_ms}ms")

    return SinglePanelsCropResponse(
        success=True,
        crop_type="single_panels",
        url=media_url,
        width=final_w,
        height=final_h,
        aspect_ratio=request.aspect_ratio or "free",
        applied_margins={
            "top_px": float(top_px),
            "bottom_px": float(bot_px),
            "left_px": float(left_px),
            "right_px": float(right_px)
        },
        auto_trimmed=auto_trimmed,
        processing_time_ms=elapsed_ms,
        message=f"Single panel cropped to {final_w}x{final_h}px in {elapsed_ms}ms"
    )
