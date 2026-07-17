"""
services/image/upload.py
─────────────────────────────────────────────────────────────────────────────
Direct image upload to Supabase storage with MIME-type normalisation.
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import time
import asyncio
import mimetypes
import logging
from typing import Optional, Dict, Any

from utils.cache import stitched_cache
from utils.supabase_storage import upload_to_supabase_bucket

logger = logging.getLogger("sonikoma.services.image.upload")


async def upload_image_service(
    file_bytes: bytes,
    filename: Optional[str],
    content_type: str
) -> Dict[str, Any]:
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


__all__ = ["upload_image_service"]
