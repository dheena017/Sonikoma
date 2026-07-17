"""
backend/app/services/image/image_io.py
─────────────────────────────────────────────────────────────────────────────
Service functions for image import/export, including file uploading and
archiving/generating ZIP payloads.
─────────────────────────────────────────────────────────────────────────────
"""

import io
import time
import uuid
import zipfile
import logging
import asyncio
import mimetypes
from typing import List, Optional, Dict, Any

import services.image.image_utils as img_utils
from utils.cache import stitched_cache, zip_cache
from utils.supabase_storage import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.services.image.io")


async def upload_image_service(file_bytes: bytes, filename: Optional[str], content_type: str) -> Dict[str, Any]:
    """Uploads single image file bytes to Supabase storage bucket or memory cache."""
    if content_type == "application/octet-stream" and filename:
        guessed_type, _ = mimetypes.guess_type(filename)
        if guessed_type:
            content_type = guessed_type

    ext = "png"
    if "jpeg" in content_type or "jpg" in content_type:
        ext = "jpeg"
    elif "webp" in content_type:
        ext = "webp"
    elif "gif" in content_type:
        ext = "gif"

    uploaded_filename = f"upload_{uuid.uuid4().hex[:8]}.{ext}"

    supabase_url = await asyncio.to_thread(
        upload_to_supabase_bucket,
        file_bytes,
        "panels",
        uploaded_filename,
        content_type
    )

    if supabase_url:
        new_url = supabase_url
    else:
        cache_id = f"upload_{int(time.time() * 1000)}"
        stitched_cache.set(cache_id, {"data": file_bytes, "content_type": content_type})
        new_url = f"/api/image/cached/{cache_id}"

    return {"success": True, "url": new_url}


async def download_zip_service(urls: List[str], referer_url: Optional[str] = None) -> Dict[str, Any]:
    """Resolves and bundles multiple panel image URLs into a single structured ZIP archive."""
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
            import re
            from utils.url_utils import parse_webtoon_url
            parsed = parse_webtoon_url(referer_url)

            def make_safe_filename(name: str) -> str:
                cleaned = re.sub(r'[^\w\s-]', '', name)
                cleaned = re.sub(r'[-\s]+', '_', cleaned)
                return cleaned.strip('_')

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
