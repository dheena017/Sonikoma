import uuid
import time
import asyncio
import io
import zipfile
import logging
from typing import Optional, Dict, Any, List, Literal

from PIL import Image

import services.image.utils as img_utils
from core.cache import stitched_cache, edit_history
from database.storage.supabase_storage import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.services.image.compose")

async def merge_images_service(
    urls: List[str],
    layout: Literal["vertical", "horizontal"] = "vertical",
    spacing: int = 0,
    spacingColor: str = "white",
    scaleToFit: bool = True,
    alignMode: Literal["center", "start", "end"] = "center",
    padding: int = 0
) -> Dict[str, Any]:
    """Orchestrates stitching together multiple image panels."""
    resolved = [await img_utils.resolve_image_to_buffer(u) for u in urls]

    merged_bytes = await asyncio.to_thread(
        img_utils.stitch_images_together,
        image_buffers=[r["data"] for r in resolved],
        layout=layout,
        spacing=spacing,
        spacingColor=spacingColor,
        scaleToFit=scaleToFit,
        alignMode=alignMode,
        padding=padding
    )
    if not merged_bytes:
        raise ValueError("Image merge failed.")

    filename = f"merged_{uuid.uuid4().hex[:8]}.png"
    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        merged_bytes,
        "panels",
        filename,
        "image/png"
    )

    unique_id = f"merged_{int(time.time() * 1000)}_merged"
    new_url = supabase_url if supabase_url else f"/api/image/cached/{unique_id}"

    try:
        stitched_cache.set(unique_id, {"data": merged_bytes, "content_type": "image/png"})
        edit_history.set(new_url, urls[0])
    except Exception:
        pass

    return {"success": True, "url": new_url}

async def execute_splits_service(url: str, splitLines: List[float], output_format: str = "jpeg") -> Dict[str, Any]:
    """Splits a vertical manhwa strip into separate panels along given percentage lines."""
    resolved = await img_utils.resolve_image_to_buffer(url)
    image_buffer = resolved["data"]

    def split_sync():
        img = Image.open(io.BytesIO(image_buffer))
        w, h = img.size

        y_coords = sorted([int(round((pct / 100.0) * h)) for pct in splitLines])
        if 0 not in y_coords:
            y_coords.insert(0, 0)
        if h not in y_coords:
            y_coords.append(h)

        res_urls = []
        for i in range(len(y_coords) - 1):
            y1 = y_coords[i]
            y2 = y_coords[i+1]
            seg_h = y2 - y1
            if seg_h < 10:
                continue

            seg = img.crop((0, y1, w, y2))
            out = io.BytesIO()
            seg.save(out, format="JPEG" if output_format == "jpeg" else "PNG", quality=92 if output_format == "jpeg" else None)
            seg_bytes = out.getvalue()

            cache_id = f"split_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}"
            filename = f"{cache_id}.{output_format}"

            try:
                sup_url = upload_to_supabase_bucket(seg_bytes, "panels", filename, f"image/{output_format}")
            except Exception:
                sup_url = None

            new_url = sup_url if sup_url else f"/api/image/cached/{cache_id}"

            try:
                stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": f"image/{output_format}"})
                edit_history.set(new_url, url)
            except Exception:
                pass
            res_urls.append(new_url)
        return res_urls

    urls = await asyncio.to_thread(split_sync)
    return {"success": True, "urls": urls}


async def download_zip_service(urls: List[str], referer_url: Optional[str] = None) -> Dict[str, Any]:
    resolved_buffers = []
    for u in urls:
        try:
            resolved = await img_utils.resolve_image_to_buffer(u)
            resolved_buffers.append(resolved)
        except Exception as ex:
            logger.warning(f"[ZIP Service] Failed to resolve URL: {u} | {ex}")

    def generate_zip_sync():
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for idx, resolved in enumerate(resolved_buffers):
                ext = "jpg"
                ct = resolved.get("content_type") or resolved.get("contentType") or ""
                if "png" in ct:
                    ext = "png"
                elif "webp" in ct:
                    ext = "webp"

                zip_file.writestr(f"panel_{idx + 1}.{ext}", resolved["data"])
        return zip_buffer.getvalue()

    zip_bytes = await asyncio.to_thread(generate_zip_sync)

    cache_id = f"export_{int(time.time() * 1000)}.zip"
    try:
        stitched_cache.set(cache_id, {"data": zip_bytes, "content_type": "application/zip"})
    except Exception:
        pass

    return {
        "success": True,
        "cacheId": cache_id,
        "filename": "sonikoma_export.zip"
    }

__all__ = [
    "merge_images_service",
    "execute_splits_service",
    "download_zip_service",
]
