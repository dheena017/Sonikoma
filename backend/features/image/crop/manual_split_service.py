"""
backend/features/image/crop/manual_split_service.py
─────────────────────────────────────────────────────────────────────────────
Interactive Cut-Line Slicer for Webtoon Strips:
- Slices a vertical strip at exact user-defined percentage lines (0-100%)
- Encodes output segments to JPEG or PNG
- Registers slices with cache / Supabase storage and records edit history
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import uuid
import logging
from typing import List, Dict, Any, Optional
from PIL import Image

from features.image.utils.media_utils import resolve_image_to_buffer
from app.core.cache import stitched_cache, edit_history
from database.supabase import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.features.image.crop.manual_split")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Internal Helpers (Top)
# ─────────────────────────────────────────────────────────────────────────────

def _percentages_to_pixel_coords(split_lines: List[float], total_height: int) -> List[int]:
    """Converts a list of percentage lines (0-100) into sorted unique pixel Y coordinates."""
    y_coords = sorted([int(round((pct / 100.0) * total_height)) for pct in split_lines])
    if 0 not in y_coords:
        y_coords.insert(0, 0)
    if total_height not in y_coords:
        y_coords.append(total_height)
    return y_coords


# ─────────────────────────────────────────────────────────────────────────────
# 2. Canonical Public API Function (Bottom)
# ─────────────────────────────────────────────────────────────────────────────

async def cut_strip_at_positions(
    url: str,
    split_lines: List[float],
    output_format: str = "jpeg"
) -> Dict[str, Any]:
    """
    Slices a continuous comic strip vertically into separate panel files along
    user-provided percentage positions.

    Args:
        url: Image URL or base64 of the source comic strip.
        split_lines: List of percentage cuts from 0.0 to 100.0.
        output_format: Format for slice files ('jpeg' or 'png').

    Returns:
        Dict with "success": True, "urls": List[str] of panel URLs.
    """
    resolved = await resolve_image_to_buffer(url)
    image_buffer = resolved.get("data")
    if not image_buffer:
        raise ValueError("Could not resolve image buffer from provided URL.")

    img = Image.open(io.BytesIO(image_buffer))
    w, h = img.size
    y_coords = _percentages_to_pixel_coords(split_lines, h)

    res_urls: List[str] = []
    fmt = output_format.lower()
    is_jpeg = fmt in ("jpeg", "jpg")

    for i in range(len(y_coords) - 1):
        y1 = y_coords[i]
        y2 = y_coords[i + 1]
        seg_h = y2 - y1

        if seg_h < 10:
            continue

        seg = img.crop((0, y1, w, y2))
        if is_jpeg and seg.mode in ("RGBA", "LA", "P"):
            seg = seg.convert("RGB")

        out = io.BytesIO()
        seg.save(out, format="JPEG" if is_jpeg else "PNG", quality=92 if is_jpeg else None)
        seg_bytes = out.getvalue()

        cache_id = f"split_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
        filename = f"{cache_id}.{fmt}"

        try:
            sup_url = upload_to_supabase_bucket(seg_bytes, "panels", filename, f"image/{fmt}")
        except Exception:
            sup_url = None

        new_url = sup_url if sup_url else f"/api/v1/images/cached/{cache_id}"

        try:
            stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": f"image/{fmt}"})
            edit_history.set(new_url, url)
        except Exception:
            pass

        res_urls.append(new_url)

    return {"success": True, "urls": res_urls, "count": len(res_urls)}


__all__ = [
    "cut_strip_at_positions",
]
