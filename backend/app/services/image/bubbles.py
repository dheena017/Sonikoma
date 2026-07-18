"""
services/image/bubbles.py
─────────────────────────────────────────────────────────────────────────────
Speech-bubble cleaning — single image and batch variants.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import time
import asyncio
import tempfile
import logging
from typing import List, Dict, Any

import services.image.image_utils as img_utils
from core.cache import stitched_cache, edit_history
from database.storage.supabase_storage import upload_to_supabase_bucket
from backend.media.image.cleaner import remove_speech_bubbles
from repositories.project.panels import save_edit_history

logger = logging.getLogger("sonikoma.services.image.bubbles")


async def bubble_cleaning_service(
    url: str,
    method: str,
    sensitivity: float,
    dilation: int,
    inpaint_radius: int,
    detection_style: str
) -> Dict[str, Any]:
    resolved = await img_utils.resolve_image_to_buffer(url)
    content_type = resolved["contentType"]

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
        tmp_in.write(resolved["data"])
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path.replace(".png", "_out.png")

    try:
        await asyncio.to_thread(
            remove_speech_bubbles,
            image_path=tmp_in_path,
            output_path=tmp_out_path,
            method=method,
            sensitivity=sensitivity,
            dilation=dilation,
            inpaint_radius=inpaint_radius,
            detection_style=detection_style
        )

        with open(tmp_out_path, "rb") as f:
            cleaned_bytes = f.read()

        filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
        supabase_url = await asyncio.to_thread(
            upload_to_supabase_bucket,
            cleaned_bytes,
            "panels",
            filename,
            content_type
        )

        cache_id = f"merged_{int(time.time() * 1000)}_cleaned"
        new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

        stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
        edit_history.set(new_url, url)
        try:

            save_edit_history(new_url, url)
        except Exception:
            pass

        return {"success": True, "url": new_url}
    finally:
        for p in (tmp_in_path, tmp_out_path):
            try:
                if os.path.exists(p):
                    os.remove(p)
            except OSError:
                pass


async def bubble_cleaning_batch_service(
    urls: List[str],
    method: str,
    sensitivity: float,
    dilation: int,
    inpaint_radius: int,
    detection_style: str
) -> Dict[str, Any]:
    results = []
    semaphore = asyncio.Semaphore(4)

    async def process_one(u: str):
        async with semaphore:
            try:
                resolved = await img_utils.resolve_image_to_buffer(u)
                content_type = resolved["contentType"]

                with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_in:
                    tmp_in.write(resolved["data"])
                    tmp_in_path = tmp_in.name

                tmp_out_path = tmp_in_path.replace(".png", "_out.png")

                try:
                    await asyncio.to_thread(
                        remove_speech_bubbles,
                        image_path=tmp_in_path,
                        output_path=tmp_out_path,
                        method=method,
                        sensitivity=sensitivity,
                        dilation=dilation,
                        inpaint_radius=inpaint_radius,
                        detection_style=detection_style
                    )

                    with open(tmp_out_path, "rb") as f:
                        cleaned_bytes = f.read()

                    filename = f"cleaned_{uuid.uuid4().hex[:8]}.png"
                    supabase_url = await asyncio.to_thread(
                        upload_to_supabase_bucket,
                        cleaned_bytes,
                        "panels",
                        filename,
                        content_type
                    )

                    cache_id = f"merged_{int(time.time() * 1000)}_cleaned_{hash(u) % 10000}"
                    new_url = supabase_url if supabase_url else f"/api/image/cached/{cache_id}"

                    stitched_cache.set(cache_id, {"data": cleaned_bytes, "content_type": content_type})
                    edit_history.set(new_url, u)
                    try:

                        save_edit_history(new_url, u)
                    except Exception:
                        pass

                    results.append({"url": u, "new_url": new_url, "success": True})
                finally:
                    for p in (tmp_in_path, tmp_out_path):
                        try:
                            if os.path.exists(p):
                                os.remove(p)
                        except OSError:
                            pass
            except Exception as e:
                results.append({"url": u, "success": False, "error": str(e)})

    tasks = [process_one(url) for url in urls]
    await asyncio.gather(*tasks)
    return {"success": True, "results": results}


__all__ = [
    "bubble_cleaning_service",
    "bubble_cleaning_batch_service",
]
