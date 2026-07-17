"""
services/image/compose.py
─────────────────────────────────────────────────────────────────────────────
Image composition operations: merge, split, and ZIP download.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import re
import uuid
import time
import asyncio
import zipfile
import logging
from typing import List, Optional, Dict, Any, Literal

from PIL import Image

import services.image.image_utils as img_utils
from utils.cache import stitched_cache, edit_history, zip_cache
from utils.supabase_storage import upload_to_supabase_bucket

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
    resolved = [await img_utils.resolve_image_to_buffer(u) for u in urls]

    merged_bytes = await asyncio.to_thread(
        img_utils.stitch_images_together,
        image_buffers=[r["data"] for r in resolved],
        layout=layout,
        spacing=spacing,
        spacing_color=spacingColor,
        scale_to_fit=scaleToFit,
        align_mode=alignMode,
        padding=padding
    )

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

    stitched_cache.set(unique_id, {"data": merged_bytes, "content_type": "image/png"})
    edit_history.set(new_url, urls[0])
    try:
        from database import db
        db.save_edit_history(new_url, urls[0])
    except Exception:
        pass

    return {"success": True, "url": new_url}


async def execute_splits_service(url: str, splitLines: List[float]) -> Dict[str, Any]:
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
            y_top = y_coords[i]
            y_bottom = y_coords[i + 1]
            if (y_bottom - y_top) <= 5:
                continue

            seg = img.crop((0, y_top, w, y_bottom))
            out = io.BytesIO()
            seg.save(out, format="JPEG", quality=92)
            seg_bytes = out.getvalue()

            try:
                trimmed = img_utils.crop_auto_borders(
                    seg_bytes,
                    tighter=True,
                    crop_padding=0,
                    sensitivity=30.0,
                    background_color_mode='auto',
                    aspect_ratio='free',
                    output_format='jpeg',
                    crop_quality=90
                )
                seg_bytes = trimmed["data"]
            except Exception:
                pass

            filename = f"split_{uuid.uuid4().hex[:8]}_{i}.jpeg"
            supabase_url = upload_to_supabase_bucket(
                seg_bytes,
                "panels",
                filename,
                "image/jpeg"
            )

            cache_id = f"split_{int(time.time() * 1000)}_{i}"
            new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

            stitched_cache.set(cache_id, {"data": seg_bytes, "content_type": "image/jpeg"})
            edit_history.set(new_url, url)
            try:
                from database import db
                db.save_edit_history(new_url, url)
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
                elif "gif" in ct:
                    ext = "gif"

                filename = f"panel_{idx + 1:03d}.{ext}"
                zip_file.writestr(filename, resolved["data"])
        return zip_buffer.getvalue()

    zip_bytes = await asyncio.to_thread(generate_zip_sync)

    zip_filename = "comic_panels_archive.zip"
    if referer_url:
        try:
            from utils.url_utils import parse_webtoon_url

            def make_safe_filename(name: str) -> str:
                cleaned = re.sub(r'[^\w\s-]', '', name)
                cleaned = re.sub(r'[-\s]+', '_', cleaned)
                return cleaned.strip('_')

            parsed = parse_webtoon_url(referer_url)
            source = make_safe_filename(parsed.get("source_name", "Source"))
            title = make_safe_filename(parsed.get("title", "Manhwa"))
            episode = make_safe_filename(parsed.get("episode", "Chapter"))

            if source or title or episode:
                parts = []
                if source and source.lower() != "custom_source" and source.lower() != "custom":
                    parts.append(source)
                if title and title.lower() != "custom_storyboard" and title.lower() != "comic":
                    parts.append(title)
                if episode and episode.lower() != "dynamic_chapter":
                    parts.append(episode)

                if parts:
                    zip_filename = "_".join(parts) + ".zip"
        except Exception as e:
            logger.warning(f"[ZIP Service] Failed to construct safe filename from URL: {e}")

    zip_id = f"zip_{int(time.time() * 1000)}"
    zip_cache.set(zip_id, {"data": zip_bytes, "filename": zip_filename})

    return {"success": True, "downloadUrl": f"/api/image/download-zip/get/{zip_id}", "filename": zip_filename}


__all__ = [
    "merge_images_service",
    "execute_splits_service",
    "download_zip_service",
]
